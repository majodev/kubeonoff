function getBasePath() {
	// Get everything after origin but before any additional path segments
	const pathname = window.location.pathname;
	// If serving from root, return empty string
	if (pathname === '/' || !pathname) return '';
	// Extract base path (first path segment)
	const match = pathname.match(/^(\/[^/]+)/);
	return match ? match[1] : '';
}

// API paths without base path prefix
const API_PREFIX = 'v1';

export const request = async (url, options) => {
	const basePath = getBasePath();
	// Ensure URL starts with forward slash and combine with base path
	const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
	const wholeURL = `${window.location.origin}${basePath}/${API_PREFIX}${normalizedUrl}`;

	const response = await fetch(wholeURL, {
		credentials: 'include',
		...options
	});

	if (!response.ok) {
		throw new Error(await response.text());
	}

	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		return response.json();
	}

	return response.text();
};

window.request = request

export const extensionRequest = (extension, url, options) =>
	request(`/kubeonoff/extensions/${extension}${url}`, options)

const convenienceMethods = [ 'GET', 'POST', 'DELETE', 'PUT', 'PATCH' ]
convenienceMethods.forEach( method => request[ method ] = ( url, options ) => request( url, {
	method,
	...options
} ) )
convenienceMethods.forEach( method => extensionRequest[ method ] = ( extension, url, options ) => extensionRequest( extension, url, {
	method,
	...options
} ) )

export const getAll = () => request.GET('/all')

export const on = name => request.POST(`/deployments/${name}/on`)

export const off = name => request.POST(`/deployments/${name}/off`)

export const restart = name => request.POST(`/deployments/${name}/restart`)

export const deletePod = name => request.DELETE(`/pods/${name}`)

export const getPodLog = (name, container, timestamps = false) =>
	request.GET(`/pods/${name}/${container}/log${timestamps ? '?timestamps=true' : ''}`)

export const getExtensions = () => request.GET('/kubeonoff/extensions')

export const getExtensionControls = extension =>
	extensionRequest.GET(extension, '/controls')