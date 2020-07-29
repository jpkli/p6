import pickle, json, logging
import numpy as np
import pandas as pd
from importlib import import_module
import sklearn.preprocessing as preprocessors

from sklearn.metrics import accuracy_score, auc, make_scorer
from sklearn.model_selection import GridSearchCV

class Model:
  def __init__(
  self, id, module, method, data, target,
  features = None, scaling = None,  parameters = {}
  ):
    self.id = id
    self.module = import_module('sklearn.' + module)
    self.method = getattr(self.module, method)
    self.model = None
    self.parameters = parameters
    self.preprocessor_name = scaling
    if scaling != None:
      self.preprocess = getattr(preprocessors, scaling)
    else:
      self.preprocess = None

    self.setData(data)
    self.target = target
    if features == None:
      self.features = [x for x in self.data.columns if x != self.target]
    else:
      self.features = features

  def setData(self, data):
    self.data = pd.DataFrame(data)
    for col in data.select_dtypes(include=['object']).columns:
      categoryColumn = data[col].astype('category').cat
      self.data[col] = categoryColumn.codes

  def getTrainData(self):
    """ Get training data by seperating features and target from all data columns """
    y = self.data[self.target]
    X = self.data[self.features]
    if self.preprocess != None:
      X = self.preprocess().fit_transform(X)
    return X, y

  def saveModelAttributes(self):
    """ Save model attributes after the model is fitted """
    self.attributes =  {'features': self.features}
    for x in [key for key in dir(self.model) if not key.startswith('__')]:
      try:
        attr = getattr(self.model, x)
        if isinstance(attr, np.ndarray):
          self.attributes[x] = list(attr)
        if type(attr) in [int, float, str]:
          self.attributes[x] = attr
      except:
        pass

  def train(self):
    """ Train model using the given method, parameters, and data """
    X, y = self.getTrainData()
    self.model = self.method(**self.parameters).fit(X, y)
    self.saveModelAttributes()
    logging.info('training complete for %s' % self.id)

  def grid_search(self, param_grid = None, cv = 5, scoring = 'f1', verbose = 1):
    """ Perform grid search to find the best parameters to fit the model """
    logging.info(param_grid)
    self.model = GridSearchCV(estimator = self.method(),
        param_grid = param_grid,
        scoring = scoring,
        cv = cv,
        verbose = verbose
      )
    X, y = self.getTrainData()
    self.model.fit(X, y)
    self.saveModelAttributes()

  def predict(self, data):
    """ Make prediction using the trained model """
    if self.preprocess != None:
      return self.model.predict(self.preprocess().fit_transform(data))
    else:
      return self.model.predict(data)
  
  def save(self):
    """ Save the model to file """
    if self.model != None:
      model_filename = 'p6-model-' + self.id + '.model'
      pickle.dump(self.model, open(model_filename, 'wb'))
      meta_filename = 'p6-model-' + self.id + '.meta'
      f = open(meta_filename, 'wb')
      f.write(json.dumps({'features': self.features, 'preprocess': self.preprocessor_name}))
      f.close()
      
    return self
  
  def loadFile(self, model_name):
    """ load the model from file """
    with open('p6-model-' + model_name + '.meta') as f:
      attributes = json.load(f)
      self.features = attributes['features']
      if attributes['preprocess'] != None:
        self.preprocess = attributes['preprocess']

    self.model = pickle.load(open('p6-model-' + model_name + '.model', 'rb'))

    return self
