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
    for col in self.data.select_dtypes(include=['object']).columns:
      categoryColumn = self.data[col].astype('category').cat
      self.data[col] = categoryColumn.codes
      self.categories[col] = list(categoryColumn.categories)

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

  def select(self, nrows = 0, columns = None, dtype = None, excludes = []):
    if type(columns) == list:
      self.data = self.raw_data[columns]
     
    if dtype == 'categorical' or dtype == 'numerical':
      self.data = self.raw_data.select_dtypes(include=DATA_TYPES[dtype])

    if excludes != None and type(excludes) == list:
      self.data = self.raw_data.drop(excludes, axis=1)

    if nrows > 0:
      self.data = self.raw_data.head(nrows)

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


  def preporcess(self, dropna = False, fillna = None):
    if dropna:
      self.data.dropna(inplace=True)

    if type(dropna) == list:
      self.data.dropna(subset=dropna, inplace=True)

    if fillna != None and type(fillna) != list:
      self.data.fillna(value=fillna)
    
    elif type(fillna) == list:
      for val in fillna:
        col = val.keys()[0]
        self.data[col] = self.data[col].fillna(val[col])
  
    return self


  def transform(self, ops):
    for opt in ops:
      if type(opt.aggregate) == dict and '$group' in opt.aggregate and '$collect' in opt.aggregate:
        self.data = self.data.groupby(aggregate['$group']).agg(aggregate['$collect']).reset_index()

    return self


  def groupby(self, keys, metrics = {}):
    groups = self.data.groupby(keys, as_index=keys, sort=False, group_keys=True)
    measure = getattr(groups, metric)
    self._result = measure()
    return self
