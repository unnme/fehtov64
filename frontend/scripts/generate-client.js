#!/usr/bin/env node

/**
 * Automatic OpenAPI client generator
 * Fetches schema from backend and generates TypeScript client
 */

import { execSync } from 'child_process'
import fs from 'fs'
import http from 'http'
import https from 'https'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Get API URL from environment or use default
const API_URL =
	process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:8000'
const OPENAPI_URL = `${API_URL}/api/v1/openapi.json`
const OUTPUT_FILE = join(projectRoot, 'openapi.json')

function fetchOpenAPISchema(url) {
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https') ? https : http

		console.log(`Fetching OpenAPI schema from ${url}...`)

		const request = client.get(url, response => {
			if (response.statusCode !== 200) {
				reject(new Error(`Failed to fetch schema: ${response.statusCode}`))
				return
			}

			let data = ''
			response.on('data', chunk => {
				data += chunk
			})

			response.on('end', () => {
				try {
					// Validate JSON
					JSON.parse(data)
					resolve(data)
				} catch (error) {
					reject(new Error(`Invalid JSON response: ${error.message}`))
				}
			})
		})

		request.on('error', error => {
			reject(new Error(`Request failed: ${error.message}`))
		})

		request.setTimeout(10000, () => {
			request.destroy()
			reject(new Error('Request timeout'))
		})
	})
}

async function generateClient() {
	try {
		// Try to fetch from URL
		try {
			const schema = await fetchOpenAPISchema(OPENAPI_URL)
			fs.writeFileSync(OUTPUT_FILE, schema)
			console.log('✓ OpenAPI schema downloaded')
		} catch (error) {
			// If URL fetch fails, check if local file exists
			if (fs.existsSync(OUTPUT_FILE)) {
				console.log(`⚠ Could not fetch from ${OPENAPI_URL}, using local file`)
				console.log(`  Error: ${error.message}`)
			} else {
				throw new Error(
					`Could not fetch schema from ${OPENAPI_URL} and no local openapi.json found.\n` +
						`Make sure backend is running or provide openapi.json file.\n` +
						`Error: ${error.message}`
				)
			}
		}

		// Generate TypeScript client
		console.log('Generating TypeScript client...')
		execSync('openapi-ts', {
			cwd: projectRoot,
			stdio: 'inherit'
		})
		console.log('✓ TypeScript client generated successfully')
	} catch (error) {
		console.error('✗ Error generating client:', error.message)
		process.exit(1)
	}
}

generateClient()
