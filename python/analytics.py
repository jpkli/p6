import io
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

import sklearn.cluster as Clustering
import sklearn.decomposition as Decomposition

DATA_TYPES = {
  'numerical': ['int', 'float'],
  'categorical': ['object']
}

class Analytics:
  def __init__(self, data, index = None, excludes = []):
    self.data = pd.DataFrame(data).drop(excludes, axis=1)
    self._result = self.data
    self.useDictForResult = False
    self.categories = {}
    for col in self.data.select_dtypes(include=['object']).columns:
      categoryColumn = self.data[col].astype('category').cat
      self.data[col] = categoryColumn.codes
      self.categories[col] = list(categoryColumn.categories)

    print(self.data.dtypes)
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
      categories = self.categories
    )

  def numpyArray(self):
    # for k, v in dict(self.data.dtypes).items():
      # if str(v) == 'int64':
      #   self.data.astype({k: 'int32'})

    for col in self.data.columns:
      self.data[col] = self.data[col].astype(np.float32)

    print(self.data.dtypes)
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

  def kmeans(self, k = 3, columns = None, out = None):
    input_data = self.data if columns == None else self.data[columns]
    kmeans = KMeans(k, random_state=0).fit(input_data)
    output_name = 'kmeans' if out == None else out
    self.data[output_name] = kmeans.labels_
    # self.schema['kmeans'] = 'int'
    self._result = kmeans.labels_
    return self

  def clustering(self, methodName, parameters = {}, columns = None, out = None):
    method = getattr(Clustering, methodName)
    input_data = self.data if columns == None else self.data[columns]
    output = method(**parameters).fit(input_data)
    output_name = methodName if out == None else out
    self.data[output_name] =  output.labels_
    self._result = output.labels_
    return self

  def pca(self, columns = None, n_components = 2, out = None):
    pca = PCA(n_components)
    # print(self.data.dtypes)
    input_data = self.data.values if columns == None else self.data[columns].values
    std_data = StandardScaler().fit_transform(input_data)
    pcs = pca.fit_transform(std_data)
    output_name = 'pca' if out == None else out
    pca_result =  pd.DataFrame(data = pcs, columns = ['%s%d'%(output_name, x) for x in range(0, n_components)])

    for pc in pca_result.columns.values:
      print('adding new attributes ', pc)
      self.data[pc] = pca_result[pc].values
    # self.data = pd.concat([self.data, pca_result], axis=1, sort=False)
    self._result = pca_result
    return self
  
  def decomposition(self, methodName, parameters = {}, columns = None,  out = None):
    method = getattr(Decomposition, methodName)
    input_data = self.data.values if columns == None else self.data[columns].values
    std_data = StandardScaler().fit_transform(input_data)
    output = method(**parameters).fit_transform(std_data)
    output_name = methodName if out == None else out
    n_components = 2
    if 'n_components' in parameters:
      n_components = parameters['n_components'] 
    result  = pd.DataFrame(data = output, columns = ['%s%d'%(output_name, x) for x in range(0,  n_components)])

    for pc in result.columns.values:
      self.data[pc] = result[pc].values
    self._result = result
    return self

  def dbscan(self, columns = None, eps = 0.3, min_samples = 3):
    input_data = self.data if columns == None else self.data[columns]
    X = StandardScaler().fit_transform(input_data)
    dbs = DBSCAN(eps=0.3, min_samples=3).fit(X)
    self.data['dbscan'] = dbs.labels_
    # self.schema['dbscan'] = 'int'
    self._result = dbs.labels_
    return self
