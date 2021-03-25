const { resolve } = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { version } = require('./package.json');


module.exports = env => {
  const
  mode = /development|production/i.test(env.mode) ? env.mode.toLowerCase() : 'development',
  prod = mode === 'production',
  outDir = resolve(__dirname, `dist/${ version }`);

  const plugins = []

  /**
   * Whether clean output directory
   */
  if (env.clean === 'true') {

    plugins.push(new CleanWebpackPlugin());

  }

  /**
   * Copy Definitions
   */
  {

    const copyDefs = [
      { from: 'src/assets', to: 'assets' }
    ]
  
    if (env.skipEnv !== 'true') {
  
      copyDefs.push({ from: 'src/environments' });
  
    }

    plugins.push(new CopyPlugin({ patterns: copyDefs }));

  }

  return {
    target: 'node',
    mode,
    entry: {
      api: resolve(__dirname, 'src/api.ts'),
      ng: resolve(__dirname, 'src/ng.ts')
    },
    node: {
      __dirname: false // disable replacing `__dirname` in compile time
    },
    output: {
      filename: '[name].js',
      path: outDir
    },
    resolve: {
      extensions: [ '.ts', '.js', '.mjs' ],
      alias: {
        graphql$: resolve(__dirname, '../../node_modules/graphql/index.js'), // workaround for apollo server graphql dup module issue #https://github.com/apollographql/apollo-server/issues/4637
        isobject: resolve(__dirname, '../../node_modules/isobject/index.js') // graphql-upload has nested node_modules
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules\/(?!mysql)/
        }
      ]
    },
    experiments: {
      topLevelAwait: true
    },
    plugins,
    stats: prod ? 'errors-only' : 'normal'
  }
}
