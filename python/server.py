import logging
import json
import joblib
import os.path

import pandas as pd
import numpy as np

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.autoreload
from tornado.options import define, options

from dask.distributed import Client
from importlib import import_module

from sklearn.preprocessing import StandardScaler

from analytics import Analytics
from model import Model

client = Client(processes=False)
# client = Client('<cluster-address>') 

define("http", default=8888, help="run on the given port", type=int)
define("stream", default=8000, help="streaming on the given port", type=int)
define("appdir", default="../dist", help="serving app in given directory", type=str)

class Application(tornado.web.Application):
  def __init__(self, appdir = '../dist'):
    handlers = [
      (r"/", MainHandler),
      (r"/analysis/([^/]+)", AnalyticsHandler),
      (r"/data/([^/]+)", DataManagement),
      # (r"/websocket", WebSocketHandler)
    ]
    settings = dict(
      cookie_secret="'a6u^=-sr5ph027bg576b3rl@#^ho5p1ilm!q50h0syyiw#zjxwxy0&gq2j*(ofew0zg03c3cyfvo'",
      template_path=os.path.join(os.path.dirname(__file__), appdir),
      static_path=os.path.join(os.path.dirname(__file__), appdir),
      static_url_prefix='/dist/',
      xsrf_cookies=False,
    )
    super(Application, self).__init__(handlers, **settings)

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

class DataManagement(tornado.web.RequestHandler):  
  def set_default_headers(self):
    self.set_header("Access-Control-Allow-Origin", "*")
    self.set_header("Access-Control-Allow-Headers", "x-requested-with")
    self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

  def post(self, opt):
    params = tornado.escape.json_decode(self.request.body)
    # print('load data', opt, params)
    res = {}
    if opt == 'upload':
      AnalyticsHandler.data = pd.DataFrame.from_dict(params['data'])
      AnalyticsHandler.program = Analytics(AnalyticsHandler.data, AnalyticsHandler.models)
      res = AnalyticsHandler.program.metadata()
    else:
      try:
        nrows = None 
        if 'nrows' in params and not np.isnan(params['nrows']):
          nrows = int(params['nrows'])
        if 'sample' in params:
          AnalyticsHandler.data = pd.read_csv(params['url'], nrows=nrows).sample(n=int(params['sample']))
        else:
          AnalyticsHandler.data = pd.read_csv(params['url'], nrows=nrows)
        AnalyticsHandler.program = Analytics(AnalyticsHandler.data, AnalyticsHandler.models)
        res = AnalyticsHandler.program.metadata()
      except:
        self.set_status(400)
    
    self.write(res)

  def get(self, format):
    if format == 'json':
      self.write(AnalyticsHandler.data.to_json(orient='records'))
    else:
      self.write(AnalyticsHandler.program.numpyArray())

class AnalyticsHandler(tornado.web.RequestHandler):
  program = None
  data = None
  models = {}
  
  def set_default_headers(self):
    self.set_header("Access-Control-Allow-Origin", "*")
    self.set_header("Access-Control-Allow-Headers", "x-requested-with")
    self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

  def get(self, opt):
    if (opt == 'metadata'):
      logging.info(AnalyticsHandler.program.metadata())
      self.write(json.dumps(AnalyticsHandler.program.metadata()))
    else:
      params = self.get_argument('spec', None, True)
      specs = json.loads(params)
      logging.info('processing spec: ', specs)
      with joblib.parallel_backend('dask'):
        for spec in specs:
          opt = list(spec)[0]
          if opt[0] == '$':
            if opt in AnalyticsHandler.program.models:
              result = AnalyticsHandler.program.predict(opt, spec[opt]['out'])
            else:
              self.set_status(400)

          else:
            method = getattr(AnalyticsHandler.program, opt)
            result = method(**spec[opt])
      
      # result = AnalyticsHandler.program.result()
      self.write(result.numpyArray())

  def post(self, opt):
    """Allow client to save models and set parameters on the server side"""
    spec = tornado.escape.json_decode(self.request.body)
    logging.info(opt, spec)
    # try:
    spec['data'] = pd.read_csv(spec['data'])
    model = Model(**spec)
    if opt == 'gridsearch' and 'parameters' in spec:
      model.grid_search(**spec['parameters'])
    else:
      model.train()
    AnalyticsHandler.models[spec['id']] = model
        
    # except:
    #   self.set_status(400)

    # return model attributes after training is completed
    self.write('test')


def main():
  tornado.options.parse_command_line()

  app = Application(options.appdir)
  app.listen(options.http)

  watch_paths = dict(
      # client_path = os.path.join(os.path.dirname(__file__), '../js'),
      # app_path = os.path.join(os.path.dirname(__file__), options.appdir),
      server_path = os.path.join(os.path.dirname(__file__), '.'),
  )

  #automatically restart server on code change.
  tornado.autoreload.start()
  for key, path in watch_paths.items():
      logging.info("Watching {0} ({1}) for changes".format(key, path))
      for dir, _, files in os.walk(path):
          [tornado.autoreload.watch(path + '/' + f) for f in files if not f.startswith('.')]

  logging.info('http server is running on ', options.http)
  tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
  main()
