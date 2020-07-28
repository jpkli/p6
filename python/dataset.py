import io
import numpy as np
import pandas as pd

import sklearn.preprocessing as preprocessors

from importlib import import_module

DATA_TYPES = {
  'numerical': ['int', 'float'],
  'categorical': ['object']
}

class Dataset:
  def __init__(self, data, index = None):
    self.raw_data = pd.DataFrame(data)
    self.data = self.raw_data
    self.categories = {}
    self.preporcess()

    if index is not None:
      self.data.set_index(index)

  def schema(self):
    s = {}
    for k, v in dict(self.data.dtypes).items():
      s[k] = str(v)
      if s[k] == 'object':
        s[k] = 'string'
      else:
        s[k] = ''.join(i for i in s[k] if not i.isdigit())
    return s

  def select(self, nrows = 0, columns = None, sample = None, dtype = None, excludes = []):
    selected_data = self.raw_data
    if type(columns) == list:
      selected_data = selected_data[columns]
    if dtype == 'categorical' or dtype == 'numerical':
      selected_data = selected_data.select_dtypes(include=DATA_TYPES[dtype])
    if excludes != None and type(excludes) == list:
      selected_data = selected_data.drop(excludes, axis=1)
    if nrows > 0:
      selected_data = selected_data.head(nrows)
    if sample != None:
      selected_data = selected_data.sample(n=int(params['sample']))

    self.data = selected_data

    return self


  def corr(self, columns = None):
    input_data = self.data if columns == None else self.data[columns]
    return input_data.corr()


  def exportNumpy(self):
    for col in self.data.columns:
      self.data[col] = self.data[col].astype(np.float32)

    memfile = io.BytesIO()
    np.save(memfile, self.data)
    memfile.seek(0)
    return memfile.read()


  def preporcess(self, spec = {'categorical': 'IntegerCodes'}):  
    if 'categorical' in spec:
      if spec['categorical'] == 'IntegerCodes':
        for col in self.data.select_dtypes(include=['object']).columns:
          categoryColumn = self.data[col].astype('category').cat
          self.data[col] = categoryColumn.codes
          self.categories[col] = list(categoryColumn.categories)
      if spec['categorical'] == 'OneHot':
        self.data = pd.get_dummies(self.data, columns=self.data.select_dtypes(include=['object']).columns)

    if 'null' in spec:
      if spec['null'] == 'drop':
        self.data.dropna(inplace=True)

      if type(spec['null']) == list:
        self.data.dropna(subset=spec['null'], inplace=True)

      if type(spec['null']) == dict and 'fill' in spec['null']:
        if type(spec['null']['fill']) in [str, int, float]:
          self.data.fillna(value=spec['null']['fill'])
        elif type(spec['null']['fill']) == dict:
          for col,val in spec['null']['fill'].items():
            self.data[col] = self.data[col].fillna(val)

    return self


  def transform(self, ops):
    for opt in ops:
      if (type(opt.aggregate) == dict and
        '$group' in opt.aggregate and
        '$collect' in opt.aggregate):
          self.data = self.data.groupby(
              opt.aggregate['$group']
            ).agg(opt.aggregate['$collect']).reset_index()

    return self


  def groupby(self, keys, metrics = {}):
    groups = self.data.groupby(keys, as_index=keys, sort=False, group_keys=True)
    measure = getattr(groups, metric)
    self._result = measure()
    return self
