function setCookie(name, value, maxAgeInSeconds, exp) {
	// const expires = new Date(Date.now() + maxAgeInSeconds * 1000).toUTCString();
	document.cookie = `${name}=${value}; max-age=${maxAgeInSeconds}; expires=${exp}; path=/; Secure`;
	console.log('Cookie set:', name);
}

function getCookieValue(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
}

function get_cx_token(user, targetLanguage) {
	let cxtoken_c = null//getCookieValue('cxtoken_json');
	if (cxtoken_c) {
		console.log('cxtoken from cookie: ', cxtoken_c);
		let cxtoken = JSON.parse(cxtoken_c)
		if (cxtoken) {
			return Promise.resolve(cxtoken);
		}
	}
	var params = {
		user: user,
		wiki: targetLanguage,
		ty: "cxtoken",
	}
	const options = {
		method: 'GET',
		dataType: 'json'
	}

	var url = "https://mdwiki.toolforge.org/Translation_Dashboard/publish/token.php?" + $.param(params)

	const result = fetch(url, options)
		.then((response) => response.json())
		.then((data) => {
			// console.log('cx token response: ', JSON.stringify(data));
			// mw.cookie.set('cx_token', JSON.stringify(result), { expires: 3600, secure: true });
			// if (data.jwt && data.age) {setCookie('cxtoken_json', JSON.stringify(data), data.age, data.exp);}
			return data;
		})
		.catch(error => {
			console.error('Error fetching mdwiki token:', error);
		});


	return result;
}
mw.cx.cx_tokens_Mdwiki = {
	get_cx_token
}
