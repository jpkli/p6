# P6: Declarative Specification for Interactive Machine Learning and Visual Analytics

P6 is a research project for developing a declarative language to specify visual analytics processes that integrate machine learning methods with interactive visualization for data analysis and exploration. P6 uses [P4](https://github.com/jpkli/p4) for GPU accelerated data processing and rendering, and leverages [Scikit-Learn](https://scikit-learn.org/stable/) and other Python libraries for supporting machine learning algorithms.

## Installation

To run P6, first install both the JavaScript and Python dependencies and libraries:

```
npm install
pip install -r python/requirements.txt
```

## Demo 

You can see the demos for using clustering, dimension reduction, and regression here:

* [K-Means Clustering and PCA](http://stream.cs.ucdavis.edu:8888/#clustering)
* [RandomForest Regressor](http://stream.cs.ucdavis.edu:8888/#regression)
* [Hierarchical Clustering and Multiple Views](http://stream.cs.ucdavis.edu:8888/#multiview)

## Development and Examples

For development and trying the example applications, use the following commands for starting the server and client

```
npm run server && npm run client
```

The example applications can be accessed at http://localhost:8080/examples/

## Usage 

```javascript
  //config 
  let app = p6({
    container: "app", // id of the div
    viewport: [800, 400]
  })
  .data({url: 'data/babies.csv'}) // input data
  
  // analyze the data using Scikit-Learn function sklearn.decomposition.PCA
  // store the results in the new variable 'PC'
  app.analyze({
    PC: {
      module: 'decomposition',
      algorithm: 'PCA',
      n_components: 2,
      features: ['BabyWeight', 'MotherWeight', 'MotherHeight', 'MotherWgtGain', 'MotherAge'] 
    }
  })

  // setup a view and visualize to it
  app.view({chart: {width: 400, height: 400}})
  .visualize({
    chart: {
      mark: 'circle', size: 8,
      x: 'PC1', y: 'PC0',
      color: 'clusters', opacity: 0.5,
    })

  ```
### Parameters for analysis methods
For setting the parameters for the `.analyze` specifications, use the same name as the functions in Python libraries. As shown in the example shown above, `n_component` is directly passed to sklearn.decomposition.PCA. More parameters can be set in this way. 