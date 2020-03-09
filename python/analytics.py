import io
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

DATA_TYPES = {
  'numerical': ['int', 'float'],
  'categorical': ['object']
}

class Analytics:

    def __init__(self, data, index = None, excludes = []):
      self.data = pd.DataFrame(data).drop(excludes, axis=1)
      self._result = self.data
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

    def numerical(self):
      self.data = self.data.select_dtypes(include=['int', 'float'])
      return self

    def categorical(self):
      self.data = self.data.select_dtypes(include=['object'])
      return self

    def result(self):
      return self._result

    def numpyArray(self):
      for k, v in dict(self.data.dtypes).items():
        if str(v) == 'int64':
          print(k, v)
          self.data.astype({k: 'int32'})

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

    def kmeans(self, k = 3):
      kmeans = KMeans(n_clusters=k, random_state=0).fit(self.data)
      self.data['kmeans'] = kmeans.labels_
      # self.schema['kmeans'] = 'int'
      self._result = kmeans.labels_
      return self

    def pca(self, n_components = 2):
      pca = PCA(n_components)
      std_data = StandardScaler().fit_transform(self.data.values)
      pcs = pca.fit_transform(std_data)
      pca_result =  pd.DataFrame(data = pcs, columns = ['PC%d'%x for x in range(0, n_components)])

      for pc in pca_result.columns.values:
        self.data[pc] = pca_result[pc].values
      # self.data = pd.concat([self.data, pca_result], axis=1, sort=False)
      self._result = pca_result
      return self

    def dbscan(self, eps = 0.3, min_samples=3):
      X = StandardScaler().fit_transform(self._result)
      db = DBSCAN(eps=0.3, min_samples=3).fit(X)
      self.data['dbscan'] = db.labels_
      self.schema['dbscan'] = 'int'
      # self._result = db.labels_
      return self
