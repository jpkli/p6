import io
import numpy as np
import pandas as pd
from importlib import import_module
from sklearn.preprocessing import StandardScaler
import ruptures as rpt

DATA_TYPES = {
  'numerical': ['int', 'float'],
  'categorical': ['object']
}

class Analytics:
  def __init__(self, data, predictors = {}, index = None, excludes = []):
    self.data = pd.DataFrame(data).drop(excludes, axis=1)
    self._result = self.data
    self.useDictForResult = False
    self.categories = {}
    self.resultColumns = []
    for col in self.data.select_dtypes(include=['object']).columns:
      categoryColumn = self.data[col].astype('category').cat
      self.data[col] = categoryColumn.codes
      self.categories[col] = list(categoryColumn.categories)

    if index is not None:
      self.data.set_index(index)

    self.predictors = predictors
    self.predictorAttributes = {}
    for predictorName in predictors:
      self.predictorAttributes[predictorName] = predictors[predictorName]['attributes']

  def schema(self):
    s = {}
    for k, v in dict(self.data.dtypes).items():
      s[k] = str(v)
      if s[k] == 'object':
        s[k] = 'string'
      else:
        s[k] = ''.join(i for i in s[k] if not i.isdigit())
    return s

  # def _operation(ops):
  #   def execution(self, *args, **kwargs): 
  #     ops(self, *args, **kwargs)
  #     return self
  #   return execution

  def numerical(self):
    self.data = self.data.select_dtypes(include=['int', 'float'])
    return self

  def categorical(self):
    self.data = self.data.select_dtypes(include=['object'])
    return self

  def corr(self, columns = None):
    input_data = self.data if columns == None else self.data[columns]
    self._result = input_data.corr()

  def result(self):
    return self._result

  def metadata(self):
    return dict(
      columns = list(self.data.columns),
      dtypes =  [str(x) for x in self.data.dtypes],
      categories = self.categories,
      results = self.resultColumns,
      predictors = self.predictorAttributes
    )

  def numpyArray(self):
    

    for col in self.data.columns:
      self.data[col] = self.data[col].astype(np.float32)

    memfile = io.BytesIO()
    np.save(memfile, self.data)
    memfile.seek(0)
    return memfile.read()

  def select(self, columns = None, dtype = None):
    if type(columns) == list:
      self.data = self.data[columns]
     
    if dtype == 'categorical' or dtype == 'numerical':
      self.data = self.data.select_dtypes(include=DATA_TYPES[dtype])
    # self.data.filter(items=columns)
    return self

  def groupby(self, keys, metric = 'count'):
    groups = self.data.groupby(keys, as_index=keys, sort=False, group_keys=True)
    measure = getattr(groups, metric)
    self.data = measure()
    # new_schema = {}
    # for k in self.data.columns.values:
    #   new_schema[k] = self.schema[k]
    # self.schema = new_schema
    return self


  def predict(self, predictorName, out = None):
    if predictorName in self.predictors:
      model = self.predictors[predictorName]['model']
      features = self.predictorAttributes[predictorName]['features']
      data = self.data[features]
      outputName = predictorName if out == None else out
      self.data[outputName] = model.predict(data)
    
    return self

  def clustering(self, methodName, parameters = {}, columns = None, out = None):
    module = import_module('sklearn.cluster')
    method = getattr(module, methodName)

    if columns == None:
      features = filter(lambda x: x  not in self.resultColumns, self.data.columns)
      input_data = self.data[features]
    else:
      input_data = self.data[columns]
      
    output = method(**parameters).fit(input_data)
    output_name = methodName if out == None else out
    self.data[output_name] =  output.labels_
    self._result = output.labels_
    if output_name not in self.resultColumns:
      self.resultColumns.append(output_name)

    return self

  def decomposition(self, methodName, parameters = {}, columns = None,  out = None):
    module = import_module('sklearn.decomposition')
    method = getattr(module, methodName)

    if columns == None:
      features = filter(lambda x: x  not in self.resultColumns, self.data.columns)
      input_data = self.data[features]
    else:
      input_data = self.data[columns]

    std_data = StandardScaler().fit_transform(input_data)
    output = method(**parameters).fit_transform(std_data)
    output_name = methodName if out == None else out
    n_components = 2
    if 'n_components' in parameters:
      n_components = parameters['n_components'] 
    result  = pd.DataFrame(data = output, columns = ['%s%d'%(output_name, x) for x in range(0,  n_components)])

    for pc in result.columns.values:
      self.data[pc] = result[pc].values
      if pc in self.resultColumns:
        self.resultColumns.append(pc)

    self._result = result
    return self

  def manifold(self, methodName, parameters = {}, columns = None,  out = None):
    module = import_module('sklearn.manifold')
    method = getattr(module, methodName)

    if columns == None:
      features = filter(lambda x: x  not in self.resultColumns, self.data.columns)
      input_data = self.data[features]
    else:
      input_data = self.data[columns]

    std_data = StandardScaler().fit_transform(input_data)
    output = method(**parameters).fit_transform(std_data)
    output_name = methodName if out == None else out
    n_components = 2
    if 'n_components' in parameters:
      n_components = parameters['n_components'] 
    result = pd.DataFrame(data = output, columns = ['%s%d'%(output_name, x) for x in range(0,  n_components)])

    for dim in result.columns.values:
      self.data[dim] = result[dim].values
      if dim not in self.resultColumns:
        self.resultColumns.append(dim)

    self._result = result
    return self

  def CPD(self, attribute, n = 7,  method = 'Binseg', model = 'l2', width = 3, out = None, gradient = False):
    # methods: Pelt, Window, 
    cpdMethod = getattr(rpt, method)
    input_data = self.data[attribute].values
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
    self.data[output_name] = output
    self._result = output
    return self


