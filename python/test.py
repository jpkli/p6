import pandas as pd
from Analytics_sklearn import Analytics
import sys

def main():
  data = pd.read_csv(sys.argv[1])
  # print(dict(data.dtypes))
  program = Analytics(data)
  res = program.select(dtype='numerical').pca()
  print(res.data)

if __name__ == "__main__":
  main()