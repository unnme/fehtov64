import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
	// Schema is downloaded by generate-client.js script
	input: './openapi.json',
	output: './src/client',

	plugins: [
		{
			name: '@hey-api/client-axios',
		},
		{
			name: '@hey-api/sdk',
			operations: {
				strategy: 'byTags',
				nesting: 'operationId',
				containerName: '{{name}}Service',
			}
		},
		{
			name: '@hey-api/schemas',
			type: 'json'
		}
	]
})
