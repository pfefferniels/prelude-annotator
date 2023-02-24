This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Preparation
Add this to your `webpack.config.js` (required to make the verovio dependency work):

```
  fallback: {
    "fs": false,
    "path": require.resolve("path-browserify"),
    "crypto": require.resolve("crypto-browserify")
  }
```

## Available Scripts

In the project directory, you can run:

### `HTTPS=true npm start`

Runs the app in the development mode.\
Open [https://localhost:3000](https://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
The app is ready to be deployed!
