import io
import numpy as np
import pandas as pd

import sklearn.preprocessing as preprocessors
import ruptures as rpt

from importlib import import_module
from dataset import Dataset

class Analytics:
  def __init__(self, data, models = {}):
    
    if isinstance(data, Dataset):
      self.dataset = data
    elif isinstance(data, pd.DataFrame) or type(data) == str:
      self.dataset = Dataset(data)
    else:
      raise Exception({'arg': 'data', 'type': 'InvalidData'})

    self._result = self.dataset.data
    self.resultColumns = []
    self.models = models

  def corr(self, columns = None):
    input_data = self.dataset.data if columns == None else self.dataset.data[columns]
    self._result = input_data.corr()

  def result(self):
    return self._result

  def metadata(self):
    modelAttributes = {}
    for modelName in self.models:
      modelAttributes[modelName] = self.models[modelName].attributes

    return dict(
      columns = list(self.dataset.data.columns),
      dtypes =  [str(x) for x in self.dataset.data.dtypes],
      categories = self.dataset.categories,
      results = self.resultColumns,
      models = modelAttributes
    )

  def numpyArray(self):
    for col in self.dataset.data.columns:
      self.dataset.data[col] = self.dataset.data[col].astype(np.float32)

    memfile = io.BytesIO()
    np.save(memfile, self.dataset.data)
    memfile.seek(0)
    return memfile.read()

  def predict(self, modelName, out = None):
    if modelName in self.models:
      model = self.models[modelName]
      features = model.attributes['features']
      data = self.dataset.data[features]
      outputName = modelName if out == None else out
      self.dataset.data[outputName] = model.predict(data)
    
    return self

  def applyML(self, moduleName, methodName, scaling, columns, parameters = {}, transform = True):
    module = import_module(moduleName)
    try:
      method = getattr(module, methodName)
    except:
      raise Exception({'arg': 'method', 'type': 'InvalidMethod', 'name': methodName})

    if columns == None:
      features = filter(lambda x: x  not in self.resultColumns, self.dataset.data.columns)
      input_data = self.dataset.data[features]
    else:
      input_data = self.dataset.data[columns]

    if scaling != None:
      try:
        preprocess = getattr(preprocessors, scaling)
      except:
        raise Exception({'arg': 'proprocessing', 'type': 'InvalidMethod', 'name': scaling})

      input_data = preprocess().fit_transform(input_data)

    if transform:
      return method(**parameters).fit_transform(input_data)
    else:
      return method(**parameters).fit(input_data)


  def clustering(self, methodName, scaling = 'StandardScaler', columns = None, parameters = {}, out = None):
    output = self.applyML('sklearn.cluster', methodName, scaling, columns, parameters, False)
    output_name = methodName if out == None else out
    self.dataset.data[output_name] =  output.labels_
    self._result = output.labels_
    if output_name not in self.resultColumns:
      self.resultColumns.append(output_name)

    return self

  def decomposition(self, methodName, scaling = 'StandardScaler', columns = None, parameters = {}, out = None):
    output = self.applyML('sklearn.decomposition', methodName, scaling, columns, parameters)
    output_name = methodName if out == None else out
    n_components = 2
    
    if 'n_components' in parameters:
      n_components = parameters['n_components'] 
    
    result  = pd.DataFrame(data = output, columns = ['%s%d'%(output_name, x) for x in range(0,  n_components)])

    for pc in result.columns.values:
      self.dataset.data[pc] = result[pc].values
      if pc in self.resultColumns:
        self.resultColumns.append(pc)

    self._result = result
    return self

  def manifold(self, methodName, scaling = 'StandardScaler', columns = None, parameters = {}, out = None):
    output = self.applyML('sklearn.manifold', methodName, scaling, columns, parameters)
    output_name = methodName if out == None else out
    n_components = 2
    if 'n_components' in parameters:
      n_components = parameters['n_components'] 
    result = pd.DataFrame(data = output, columns = ['%s%d'%(output_name, x) for x in range(0,  n_components)])

    for dim in result.columns.values:
      self.dataset.data[dim] = result[dim].values
      if dim not in self.resultColumns:
        self.resultColumns.append(dim)

    self._result = result
    return self

  def CPD(self, attribute, n = 7,  method = 'Binseg', model = 'l2', width = 3, out = None, gradient = False):
    # methods: Pelt, Window, 
    cpdMethod = getattr(rpt, method)
    input_data = self.dataset.data[attribute].values
    if gradient == True:
      input_data = np.gradient(input_data)

    if method == 'Window':
      algo = cpdMethod(width=width, model=model).fit(input_data)
    else:
      algo = cpdMethod(model=model).fit(input_data)
    
    if method == 'Pelt':
      changePoints = algo.predict(pen=n)
    else:
      changePoints = algo.predict(n_bkps=n)

    output_name = 'CPD' if out == None else out
    output = np.zeros(input_data.size)
    offset = 0
    for idx in changePoints[:-1]:
      output[idx] = 1 + offset
      offset += 1
    self.dataset.data[output_name] = output
    self._result = output
    
    return self
