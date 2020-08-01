# P6: Declarative Specification for Interactive Machine Learning and Visual Analytics

P6 is a research project for developing a declarative language to specify visual analytics processes that integrate machine learning methods with interactive visualization for data analysis and exploration. P6 uses [P4](https://github.com/jpkli/p4) for GPU accelerated data processing and rendering, and leverages [Scikit-Learn](https://scikit-learn.org/stable/) and other Python libraries for supporting machine learning algorithms.


## Demo 

Demos for using declarative specifications with clustering, dimension reduction, and regression here:

* [K-Means Clustering and PCA](http://stream.cs.ucdavis.edu:8888/#clustering)
* [RandomForest Regressor](http://stream.cs.ucdavis.edu:8888/#regression)
* [Hierarchical Clustering and Multiple Views](http://stream.cs.ucdavis.edu:8888/#multiview)
* [Brushing and Linking with Dimension Reductions](http://stream.cs.ucdavis.edu:8888/#triviewbrush)


## Installation

To run P6, first install both the JavaScript and Python dependencies and libraries:

```
npm install
pip install -r python/requirements.txt
```

## Development and Examples

For development and trying the example applications, use the following commands for starting the server and client

```
npm start
```

__Or__ start server and client on two different terminals/consoles:

```
npm run server
npm run client
```

The example applications can be accessed at http://localhost:8080/examples/

## Usage 

```javascript
  //config 
  let app = p6()
    .data({url: 'data/babies.csv'}) // input data
    .analyze({
      // analyze the data using sklearn.decomposition.PCA and store the result in a new variable 'PC'
      PC: {
        module: 'decomposition',
        algorithm: 'PCA',
        n_components: 2,
        features: ['BabyWeight', 'MotherWeight', 'MotherHeight', 'MotherWgtGain', 'MotherAge'] 
      }
    })

  app.layout({
    container: "app", // id of the div
    viewport: [800, 400]
  })
  .visualize({
    chart: {
      mark: 'circle', size: 8,
      x: 'PC1', y: 'PC0',
      color: 'clusters', opacity: 0.5,
    }
  })
```

## API

P6 provides a JavaScript API with a declarative language for specifying operations in visual analytics processes, which include data processing, machine learning, visualization, interaction.

#### Data
```javascript
data({source, selection, preprocess, transform})
```
* __source__: source of the dataset, example: {url: './data/babies.csv}
* __select__: select data subset by rows, columns, or data types. Example: {select: {nrows: 10000, columns: ['BabyWeight', 'BabyGender']}}
  * __nrows__ - number of rows
  * __columns__ - specify which data columns
  * __dtype__ - select `categorical` or `numerical` data
* __preprocess__: preprocess data by dtypes.
  * Example for using one-hot encoding on categorical data: {preprocess: {categorical: 'OneHot'}}
  * Example for dropping null values: {preprocess: {null: 'drop'}}
  * Example for filling null values by columns: {preprocess: {null: {fill: {BabyWeight: 8}}}


#### Machine Learning and Analytics
```javascript
analyze({algorithm, features, scaling, [parameters]})
```
* __algorithm__: supported algorithms and methods - [clustering](https://scikit-learn.org/stable/modules/clustering.html), [dimension reduction](https://scikit-learn.org/stable/modules/classes.html#module-sklearn.decomposition), [manifold](https://scikit-learn.org/stable/modules/manifold.html)
* __features__: data fields as the input to the specified `algorithm`.
* __scaling__: use `StandardScaler`,  `LabelEncoder` `minmax_scale`, or other [preprocessors](https://scikit-learn.org/stable/modules/classes.html#module-sklearn.preprocessing) for scaling the input data
* __[parameters]__: use the same name as the functions in Python libraries. As shown in the example shown above, `n_component` is directly passed to `sklearn.decomposition.PCA`. More parameters can be set in this way. 

#### Train model for classification and regression tasks

```javascript
model({module, method, trainingData, features, target, [parameters]})
```
* __module__: Python library and module containing the `method` for fitting the model. Example: `sklearn.linearmodel`.
* __method__: the function to be called for fitting the model. Example: `LinearRegression`.
* __trainingData__: data for training the model
* __features__: input features to the model
* __target__: the data field for prediction
* __[parameters]__: hyperparameters for the model


### Visualization
To organize the views for visualization, the `layout` function can be used for configuring the views and layouts.

#### View Layout
```javascript
layout({id, width, height, padding, [options]})
```

To visualize data or analysis result, call `visualize' to transform data (optional), choose a visual mark, and specify the visual encoding for mapping data to visual marks. 

#### Visual Encoding/Mapping
```javascript
visualize({transform, visualMark, [encoding]})
```


