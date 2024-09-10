
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
	try {
		const result = await fetch(url, options)
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
			})
			.catch((error) => {
				console.log(error);
			})
		var html = result.html;
	} catch (error) {
		console.log(error);
	}
	return html;
}
/**
     * Extracts the revision number from a given HTML text.
     *
     * This function searches for a specific pattern in the provided HTML text
     * that indicates a redirect to a revision. If the pattern is found, it
     * returns the revision number; otherwise, it returns an empty string.
     *
     * @param {string} HTMLText - The HTML text to search for the revision number.
     * @returns {string} The extracted revision number if found, otherwise an empty string.
     *
     * @example
     * const html = '<a href="Redirect/revision/12345">Link</a>';
     * const revision = getRevision_old(html);
     * console.log(revision); // Outputs: '12345'
     *
     * @throws {TypeError} Throws an error if the input is not a string.
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
/**
     * Parses the provided HTML text to extract a specific revision ID from span elements
     * that contain a data attribute with the key "data-mw". If the revision ID is found,
     * the corresponding span element is removed from the DOM, and the modified HTML is returned.
     *
     * @param {string} HTMLText - The HTML text to be parsed.
     * @returns {{ rev: string, html: string }} An object containing the extracted revision ID
     * and the modified HTML text. If no revision ID is found, an empty string is returned for rev.
     *
     * @example
     * const result = getRevision_new2('<span data-mw="{&quot;wt&quot;:&quot;mdwiki revid&quot;,&quot;parts&quot;:[{&quot;template&quot;:{&quot;params&quot;:[null,{&quot;wt&quot;:&quot;12345&quot;}]}}]}"></span>');
     * console.log(result.rev); // Outputs: "12345"
     * console.log(result.html); // Outputs: modified HTML without the span
     *
     * @throws {SyntaxError} Throws an error if the data-mw attribute's JSON is malformed.
     */
function getRevision_new2(HTMLText) {
	// إنشاء وثيقة DOM من النص HTML
	const parser = new DOMParser();
	const doc = parser.parseFromString(HTMLText, 'text/html');

	// البحث عن جميع وسوم span
	const spans = doc.querySelectorAll('span[data-mw]');

	// حلقة عبر الوسوم للعثور على العنصر الذي يحتوي على mdwiki revid
	for (let span of spans) {
		const dataMW = span.getAttribute('data-mw');

		if (dataMW && dataMW.includes('"wt":"mdwiki revid"')) {
			const data = JSON.parse(dataMW); // تحويل النص إلى JSON
			const revid = data.parts[0].template.params['1'].wt; // استخراج revid
			console.log("getRevision_new2 rev", revid);
			span.remove(); // إزالة وسم span من DOM
			return { rev: revid, html: doc.body.innerHTML }; // إرجاع revid والنص بعد التعديل
		}
	}

	return { rev: "", html: HTMLText };
}

/**
     * Extracts the revision number from the provided HTML text and removes the corresponding <span> element.
     *
     * This function searches for a specific <span> element that contains a data attribute indicating the 
     * revision ID in the format of "mdwiki revid". If found, it extracts the revision number and returns 
     * it along with the updated HTML text without the matched <span> element.
     *
     * @param {string} HTMLText - The HTML text to search for the revision number.
     * @returns {{ rev: string, html: string }} An object containing:
     *   - rev: The extracted revision number, or an empty string if not found.
     *   - html: The updated HTML text with the matched <span> element removed.
     *
     * @example
     * const result = getRevision_new("<span data-mw='...' target='{\"wt\":\"mdwiki revid\"}' ...>12345</span>");
     * console.log(result.rev); // Outputs: "12345"
     * console.log(result.html); // Outputs: Updated HTML without the <span>
     *
     * @throws {Error} Throws an error if the HTMLText is not a valid string.
     */
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


/**
     * Removes all <span> elements from the provided HTML string that contain the text 'unlinkedwikibase'.
     *
     * This function parses the input HTML, identifies <span> elements, and checks if their outer HTML
     * contains the specified text. If found, the element is removed from the DOM and the original HTML
     * string is updated accordingly.
     *
     * @param {string} html - The HTML string from which <span> elements should be removed.
     * @returns {string} The modified HTML string with specified <span> elements removed.
     *
     * @example
     * const inputHtml = '<div><span>unlinkedwikibase</span><span>linked</span></div>';
     * const result = removeUnlinkedWikibase(inputHtml);
     * // result will be '<div><span>linked</span></div>'
     *
     * @throws {Error} Throws an error if the input is not a valid HTML string.
     */
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
     * This function fetches the HTML content associated with the provided title, processes it to extract
     * relevant information, and returns an object containing the source language, title, revision, 
     * segmented content, and categories. If the content cannot be found or processed, it returns false.
     *
     * @param {string} title - The title of the content to retrieve from Mdwiki.
     * @returns {Promise<Object|boolean>} A promise that resolves to an object containing the following properties:
     *   - sourceLanguage {string} - The source language of the content (always "mdwiki").
     *   - title {string} - The title of the content.
     *   - revision {string} - The revision identifier of the content.
     *   - segmentedContent {string} - The processed segmented content.
     *   - categories {Array} - An array of categories associated with the content.
     *   Returns false if the content is not found or if processing fails.
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

async function fetchSourcePageContent_mdwiki(wikiPage, targetLanguage, siteMapper) {
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

	const result = await get_html_from_mdwiki(targetLanguage, title, fetchPageUrl);

	return result;

};
mw.cx.TranslationMdwiki = {
	fetchSourcePageContent_mdwiki
}
