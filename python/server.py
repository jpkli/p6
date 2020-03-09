import logging
import json
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
# import tornado.websocket
import tornado.autoreload
import os.path
from tornado.options import define, options
from analytics import Analytics

import pandas as pd
import numpy as np

define("http", default=8888, help="run on the given port", type=int)
define("stream", default=8000, help="streaming on the given port", type=int)
define("appdir", default="../apps", help="serving app in given directory", type=str)
define("datafile", default='', help="load data from file", type=str)

class Application(tornado.web.Application):
  def __init__(self, appdir = 'app'):
    handlers = [
      (r"/", MainHandler),
      (r"/analysis/([^/]+)", AnalyticsHandler),
      # (r"/websocket", WebSocketHandler)
    ]
    settings = dict(
      cookie_secret="'a6u^=-sr5ph027bg576b3rl@#^ho5p1ilm!q50h0syyiw#zjxwxy0&gq2j*(ofew0zg03c3cyfvo'",
      template_path=os.path.join(os.path.dirname(__file__), appdir),
      static_path=os.path.join(os.path.dirname(__file__), appdir),
      static_url_prefix='/static/',
      xsrf_cookies=True,
    )
    super(Application, self).__init__(handlers, **settings)

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

class AnalyticsHandler(tornado.web.RequestHandler):
  program = None

  def set_default_headers(self):
    self.set_header("Access-Control-Allow-Origin", "*")
    self.set_header("Access-Control-Allow-Headers", "x-requested-with")
    self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

  def get(self, opt):
    print(opt)
    if (opt == 'metadata'):
      print(AnalyticsHandler.program.metadata())
      self.write(json.dumps(AnalyticsHandler.program.metadata()))
    else:
      params = self.get_argument("spec", None, True)
      specs = json.loads(params)
      print(specs)
      for spec in specs:
        opt = list(spec)[0]
        method = getattr(AnalyticsHandler.program, opt)
        print(spec[opt])
        result = method(**spec[opt])
      
      # result = AnalyticsHandler.program.result()
      self.write(result.numpyArray())

def main():
  tornado.options.parse_command_line()

  if (os.path.isfile(options.datafile)):
    data = pd.read_csv(options.datafile)
    AnalyticsHandler.program = Analytics(data)
    # print(dict(data.dtypes))

  app = Application(options.appdir)
  app.listen(options.http)

  watch_paths = dict(
      # client_path = os.path.join(os.path.dirname(__file__), '../js'),
      app_path = os.path.join(os.path.dirname(__file__), options.appdir),
      server_path = os.path.join(os.path.dirname(__file__), '.'),
  )

  print(options.appdir)

  #automatically restart server on code change.
  tornado.autoreload.start()
  for key, path in watch_paths.items():
      print("Watching {0} ({1}) for changes".format(key, path))
      for dir, _, files in os.walk(path):
          [tornado.autoreload.watch(path + '/' + f) for f in files if not f.startswith('.')]

  print('http server is running on ', options.http)
  tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
  main()
