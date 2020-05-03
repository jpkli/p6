# P6: Declarative Specification for Interactive Machine Learning and Visual Analytics

P6 is a research project for developing a declarative language to specify visual analytics processes that integrate machine learning methods with interactive visualization for data analysis and exploration. P6 uses [P4](https://github.com/jpkli/p4) for GPU accelerated data processing and rendering, and leverages [Scikit-Learn](https://scikit-learn.org/stable/) and other Python libraries for supporting machine learning algorithms.

## Installation

For running P6, both the JavaScript and Python dependencies and libraries need to be installed:

```
npm install
pip install python/requirements.txt
```

## Development and Examples

For development and trying the example applications, use the following commands for starting the server and client

```
npm run server && npm run client
```

The example applications can be accessed via http://localhost:8080/examples/
