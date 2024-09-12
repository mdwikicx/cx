
function add_sw_categories(html) {
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

/**
     * Asynchronously retrieves HTML content from the Medwiki API for a specified title.
     *
     * This function constructs a URL based on the provided title, encodes it for safe transmission,
     * and makes a GET request to the Medwiki API. It returns the HTML content of the page if available,
     * or an empty string if the request fails or the HTML content is not present in the response.
     *
     * @param {string} title - The title of the Medwiki page to retrieve. 
     *                         The title will be prefixed with "Md:" and spaces will be replaced with underscores.
     * @returns {Promise<string>} A promise that resolves to the HTML content of the requested page, 
     *                            or an empty string if the content is not available.
     *
     * @throws {Error} Throws an error if the fetch operation fails.
     *
     * @example
     * getMedwikiHtml('Example Title').then(html => {
     *   console.log(html);
     * }).catch(error => {
     *   console.error('Error fetching Medwiki HTML:', error);
     * });
     */
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
	let req = await fetch(url, options)
		.then((response) => {
			if (response.ok) {
				return response.json();
			}
		})
		.catch((error) => {
			console.log(error);
		})
	if (!req || !req.html) {
		return "";
	}
	return req.html
}

/**
     * Extracts the revision number from a given HTML text.
     *
     * This function searches for a specific pattern in the provided HTML text
     * that indicates a redirect to a revision. If a valid revision number is found,
     * it is returned as a string. If no revision number is found or if the input
     * is an empty string, an empty string is returned.
     *
     * @param {string} HTMLText - The HTML text to search for the revision number.
     * @returns {string} The extracted revision number, or an empty string if not found.
     *
     * @example
     * const revision = getRevision_old('<a href="Redirect/revision/12345">');
     * console.log(revision); // Outputs: "12345"
     *
     * @example
     * const revision = getRevision_old('');
     * console.log(revision); // Outputs: ""
     */
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

/**
     * Asynchronously retrieves and processes content from a specified title in the Mdwiki format.
     *
     * This function fetches HTML content related to the provided title, extracts relevant revisions,
     * and formats the content for further use. It returns an object containing the source language,
     * title, revision, segmented content, and categories.
     *
     * @param {string} title - The title of the Mdwiki page to retrieve content from.
     * @returns {Promise<Object|boolean>} A promise that resolves to an object containing the following properties:
     *   - sourceLanguage: {string} The source language of the content (always "mdwiki").
     *   - title: {string} The title of the Mdwiki page.
     *   - revision: {string} The revision identifier of the content.
     *   - segmentedContent: {string} The processed HTML content.
     *   - categories: {Array} An array of categories associated with the content.
     *   Returns false if the content could not be retrieved or processed.
     *
     * @throws {Error} Throws an error if there is an issue with fetching or processing the HTML content.
     *
     * @example
     * get_new('Example_Title').then(result => {
     *   if (result) {
     *     console.log(result);
     *   } else {
     *     console.log('Content not found or processing failed.');
     *   }
     * });
     */
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

	out.revision = getRevision_old(html);
	html = removeUnlinkedWikibase(html);

	let tab = getRevision_new(html);
	if (tab.rev != "") {
		out.revision = tab.rev;
		// if (tab.html != "") { out.segmentedContent = tab.html; }
	} else {
		tab = getRevision_new2(html);
		if (tab.rev != "") {
			out.revision = tab.rev;
		}
	}

	if (!html || html == "") {
		console.log("html: not found");
		return false;
	};
	out.segmentedContent = await doFixIt(html);
	// out.segmentedContent = doFixItnew(html);
	if (!out.segmentedContent || out.segmentedContent == "") {
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
