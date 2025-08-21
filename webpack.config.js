const path = require('path')

module.exports = {
    target: 'electron-main',
    entry: './main.ts',
    output: {
        path: path.resolve(__dirname, './build'),
        filename: 'main.js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "path": false,
            "fs": false
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                include: [
                    path.resolve(__dirname, 'main.ts'),
                    path.resolve(__dirname, 'AppWindow.ts'),
                    path.resolve(__dirname, 'src/utils/menuTemplate.ts'),
                    path.resolve(__dirname, 'src/utils/AliOssManager.ts'),
                    path.resolve(__dirname, 'src/types')
                ],
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.main.json'
                    }
                }
            }
        ]
    },
    externals: {
        'ali-oss': 'commonjs ali-oss'
    },
    node: {
        __dirname: false
    }
}