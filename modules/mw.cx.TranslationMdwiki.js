
/**
     * Analyzes the provided HTML content and extracts software categories based on specific infobox patterns.
     *
     * This function checks for the presence of "infobox drug" and "infobox medical condition" in the HTML string.
     * If found, it adds corresponding categories to the result.
     *
     * @param {string} html - The HTML content to be analyzed for categories.
     * @returns {Array<Object>} An array of category objects, each containing the adapted status and titles.
     * 
     * @example
     * const result = add_sw_categories('<div class="infobox drug">...</div>');
     * console.log(result);
     * // Output: [{ adapted: true, sourceTitle: "Category:Madawa", targetTitle: "Jamii:Madawa" }]
     *
     * @throws {Error} Throws an error if the input is not a string.
     */
function add_sw_categories(html) {
	/**
	     * Processes a category string and logs it to the console.
	     * Returns an object containing adapted status and titles based on the provided category.
	     *
	     * @param {string} cat - The category to be processed.
	     * @returns {Object} An object with the following properties:
	     *   - adapted {boolean}: Indicates if the category was adapted (always true).
	     *   - sourceTitle {string}: The source title formatted as "Category:<cat>".
	     *   - targetTitle {string}: The target title formatted as "Jamii:<cat>".
	     *
	     * @example
	     * const result = one("Books");
	     * console.log(result);
	     * // Output:
	     * // add_sw_categories: Books
	     * // { adapted: true, sourceTitle: 'Category:Books', targetTitle: 'Jamii:Books' }
	     */
	function one(cat) {
		console.log("add_sw_categories:", cat);
		return {
			"adapted": true,
			"sourceTitle": "Category:" + cat,
			"targetTitle": "Jamii:" + cat
		}
	}

	let categories = [];
	const regexInfoboxDrug = /infobox drug/i;
	const regexInfoboxMedicalCondition = /infobox medical condition/i;

	// if html has "infobox drug" categories.push( one("Madawa") );
	// if html has "infobox medical condition" categories.push( one("Magonjwa") );

	if (regexInfoboxDrug.test(html)) {
		categories.push(one("Madawa"));
	}

	if (regexInfoboxMedicalCondition.test(html)) {
		categories.push(one("Magonjwa"));
	}

	console.log(JSON.stringify(categories));
	console.log("add_sw_categories. Done");

	return categories;
}
/**
     * Sends a POST request to the specified endpoint with the given parameters.
     *
     * This asynchronous function constructs a request with JSON content type and sends it to the provided endpoint.
     * It handles the response by checking if the request was successful and returns the parsed JSON data.
     *
     * @async
     * @param {string} endPoint - The URL to which the request is sent.
     * @param {Object} [params={}] - An optional object containing the parameters to be sent in the request body.
     * @returns {Promise<Object|boolean>} A promise that resolves to the parsed JSON response if successful, or false if the request failed.
     *
     * @throws {Error} Throws an error if the fetch operation fails due to network issues.
     *
     * @example
     * postUrlParamsResult('https://api.example.com/data', { key: 'value' })
     *   .then(result => {
     *     if (result) {
     *       console.log('Success:', result);
     *     } else {
     *       console.log('Request failed');
     *     }
     *   });
     */
async function postUrlParamsResult(endPoint, params = {}) {

	const options = {
		headers: { "Content-Type": "application/json" },
		method: 'POST',
		dataType: 'json',
		// mode: 'no-c',
		body: JSON.stringify(params)
	};

	const output = await fetch(endPoint, options)
		.then((response) => {
			if (!response.ok) {
				console.error(`Fetch Error: ${response.statusText}`);
				console.error(endPoint);
				return false;
			}
			return response.json();
		})

	return output;
}

async function doFixIt(text) {
	let url = 'https://ncc2c.toolforge.org/textp';

	// if (window.location.hostname === 'localhost') {
	// 	url = 'http://localhost:8000/textp';
	// }

	const data = { html: text };
	const responseData = await postUrlParamsResult(url, data);

	// Handle the response from your API
	if (!responseData) {
		return "";
	}

	if (responseData.error) {
		console.error('Error: ' + responseData.error);
		return "";
	}

	if (responseData.result) {
		return responseData.result
	}

	return "";
}

async function from_simple(targetLanguage, title) {
	title = encodeURIComponent(title);
	const simple_url = "https://cxserver.wikimedia.org/v2/page/simple/" + targetLanguage + "/User:Mr.%20Ibrahem%2F" + title;

	const simple_result = await fetch(simple_url)
		.then((response) => {
			if (response.ok) {
				return response.json();
			}
		})

	if (simple_result) {
		simple_result.sourceLanguage = "en";
		// replace simple.wikipedia with en.wikipedia
		simple_result.segmentedContent = simple_result.segmentedContent.replace(/simple.wikipedia/g, "en.wikipedia");
		simple_result.segmentedContent = simple_result.segmentedContent.replace("User:Mr. Ibrahem/", "");
		simple_result.segmentedContent = simple_result.segmentedContent.replace("Drugbox", "Infobox drug");

	}
	return simple_result;
}

async function getMedwikiHtml(title) {
	title = "Md:" + title.replace(/\s/g, "_");

	// Encode forward slashes
	// title = title.replace(/\//g, "%2F");
	title = encodeURIComponent(title);

	// const url = "rest.php/v1/page/" + title + "/with_html";
	const url = "https://medwiki.toolforge.org/w/rest.php/v1/page/" + title + "/with_html";

	const options = {
		method: 'GET',
		dataType: 'json'
	};
	let html;
	try {
		html = await fetch(url, options)
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
			})
			.then((data) => {
				return data.html;
			})
			.catch((error) => {
				console.log(error);
			})
	} catch (error) {
		console.log(error);
	}
	return html;
}
function getRevision_old(HTMLText) {
	if (HTMLText !== '') {
		const matches = HTMLText.match(/Redirect\/revision\/(\d+)/);
		if (matches && matches[1]) {
			const revision = matches[1];
			return revision;
		}
	}
	return "";
}
function getRevision_new2(HTMLText) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(HTMLText, 'text/html');

	const spans = doc.querySelectorAll('span[data-mw]');

	for (let span of spans) {
		const dataMW = span.getAttribute('data-mw');

		if (dataMW && dataMW.includes('"wt":"mdwiki revid"')) {
			let data;
			try {
				data = JSON.parse(dataMW);
			} catch (e) {
				console.error("JSON parsing error:", e);
				return { rev: "", html: HTMLText }; // Return empty revision on error
			}
			const revid = data.parts[0].template.params['1'].wt;
			console.log("getRevision_new2 rev", revid);
			span.remove();
			return { rev: revid, html: doc.body.innerHTML };
		}
	}

	return { rev: "", html: HTMLText };
}

function getRevision_new(HTMLText) {
	if (HTMLText !== '') {
		// مطابقة span الذي يحتوي على "mdwiki revid" فقط
		const regex = /<span[^>]*data-mw='[^']*"target":\{"wt":"mdwiki revid"[^}]*\},"params":\{"1":\{"wt":"(\d+)"\}[^>]*><\/span>/;
		const matches = HTMLText.match(regex);

		if (matches && matches[1]) {
			const revision = matches[1];
			console.log("getRevision_new rev", revision);
			// إزالة وسم <span> الذي تم مطابقته
			const updatedHTML = HTMLText.replace(matches[0], '');
			return { rev: revision, html: updatedHTML };
		}
	}
	return { rev: "", html: HTMLText };
}


function removeUnlinkedWikibase(html) {
	// إنشاء كائن DOMDocument وتحميل HTML فيه
	const parser = new DOMParser();
	const dom = parser.parseFromString(html, 'text/html');

	// الحصول على جميع العناصر من نوع <span>
	const elements = dom.getElementsByTagName('span');

	// تحويل العناصر إلى مصفوفة للتعامل معها في حلقة
	Array.from(elements).forEach(element => {
		// الحصول على HTML الخاص بالعنصر
		const nhtml = element.outerHTML;

		// التحقق مما إذا كان HTML يحتوي على 'unlinkedwikibase'
		if (nhtml.toLowerCase().includes('unlinkedwikibase')) {
			// إزالة العنصر من الوثيقة
			element.parentNode.removeChild(element);

			// استبدال HTML في النص الأصلي
			html = html.replace(nhtml, '');
		}
	});

	// إعادة النص المعدل
	return html;
}

async function get_new(title) {

	const out = {
		sourceLanguage: "mdwiki",
		title: title,
		revision: "",
		segmentedContent: "",
		categories: []
	}
	var html = await getMedwikiHtml(title);

	if (!html) {
		console.log("getMedwikiHtml: not found");
		return false;
	};

	html = removeUnlinkedWikibase(html);

	let tab = getRevision_new(html);
	out.revision = tab.rev;
	html = tab.html;
	if (out.revision == "") {
		tab = getRevision_new2(html);
		out.revision = tab.revision;
		html = tab.updatedHTML;
	}

	out.segmentedContent = await doFixIt(html);
	if (out.segmentedContent == "") {
		console.log("doFixIt: not found");
		return false;
	};
	return out;
}

async function get_html_from_mdwiki(targetLanguage, title, fetchPageUrl) {
	const fetchParams = {
		sourcelanguage: "mdwiki",
		targetlanguage: targetLanguage,
		section0: 1,
		title: title
	};

	fetchPageUrl = fetchPageUrl + "?" + $.param(fetchParams);

	const options = {
		method: 'GET',
		dataType: 'json'
	};
	const result = await fetch(fetchPageUrl, options)
		.then((response) => {
			if (!response.ok) {
				console.error("Error fetching source page: " + response.statusText);
				return Promise.reject(response);
			}
			return response.json();

		})
		.catch((error) => {
			console.error("Network error: ", error);
		});
	return result;
};

/**
     * Fetches the content of a specified wiki page in a target language.
     * This function handles normalization of the page title to avoid issues with spaces and namespaces.
     * It attempts to retrieve the content from a simplified source if available, 
     * and falls back to fetching the content from the MedWiki API.
     *
     * @async
     * @param {Object} wikiPage - The wiki page object containing metadata about the page.
     * @param {string} targetLanguage - The language code for the desired content (e.g., 'en', 'fr').
     * @param {Object} siteMapper - An object that maps site-specific configurations.
     * @returns {Promise<string>} A promise that resolves to the HTML content of the wiki page.
     *
     * @throws {Error} Throws an error if the fetching process fails or if the page does not exist.
     *
     * @example
     * fetchSourcePageContent_mdwiki_new(wikiPage, 'en', siteMapper)
     *   .then(content => {
     *     console.log(content);
     *   })
     *   .catch(error => {
     *     console.error('Error fetching page content:', error);
     *   });
     */
async function fetchSourcePageContent_mdwiki_new(wikiPage, targetLanguage, siteMapper) {
	// Manual normalisation to avoid redirects on spaces but not to break namespaces
	var title = wikiPage.getTitle().replace(/ /g, '_');
	title = title.replace('/', '%2F');
	// ---
	var get_from_simple = false;
	// ---
	if (get_from_simple) {
		var simple_result = from_simple(targetLanguage, title);
		if (simple_result) {
			return simple_result;
		};
	}

	var fetchPageUrl = "https://medwiki.toolforge.org/get_html/index.php";

	const new_way = true;

	if (new_way || mw.user.getName() === "Mr. Ibrahem") {
		// fetchPageUrl = "https://medwiki.toolforge.org/get_html/oo.php";
		var resultx = await get_new(title);
		if (resultx) {
			return resultx;
		}
	};

	let result = await get_html_from_mdwiki(targetLanguage, title, fetchPageUrl);

	return result;

};

/**
     * Fetches the content of a specified wiki page and processes it for a target language.
     *
     * This asynchronous function retrieves the source page content from a media wiki and, if the target language is 
     * "sw" (Swahili), it adds specific categories to the result.
     *
     * @async
     * @function fetchSourcePageContent_mdwiki
     * @param {string} wikiPage - The title of the wiki page to fetch content from.
     * @param {string} targetLanguage - The language code for the target language (e.g., "sw" for Swahili).
     * @param {Object} siteMapper - An object that maps site-specific configurations or settings.
     * @returns {Promise<Object>} A promise that resolves to an object containing the fetched content and any added categories.
     * @throws {Error} Throws an error if the fetch operation fails or if the response is invalid.
     *
     * @example
     * fetchSourcePageContent_mdwiki('Example_Page', 'sw', siteMapper)
     *   .then(result => {
     *     console.log(result);
     *   })
     *   .catch(error => {
     *     console.error('Error fetching page content:', error);
     *   });
     */
async function fetchSourcePageContent_mdwiki(wikiPage, targetLanguage, siteMapper) {

	let result = await fetchSourcePageContent_mdwiki_new(wikiPage, targetLanguage, siteMapper);

	if (result && result.html && targetLanguage == "sw") {
		let categories = add_sw_categories(result.html);
		result.categories = categories;
	}
	return result;

};

mw.cx.TranslationMdwiki = {
	fetchSourcePageContent_mdwiki
}
