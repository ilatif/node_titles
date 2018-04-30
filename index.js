const http = require('http');
const https = require('https');
const url  = require('url');
const port = 5000;

let titles = [], sites = [];

const requestHandler = (request, response) => {
  titles = [], sites = [];
  const requestUrl = request.url;
  if (requestUrl.indexOf('/I/want/title') >= 0) {
    const queryParams = url.parse(requestUrl, true).query;
    if (queryParams['address']) {
      sites = queryParams['address'].split(',');
      getTitles(0, response);
    } else {
      response.end('');
    }
  } else {
    response.statusCode = 404;
    response.end('Not Found');
  }
}

const server = http.createServer(requestHandler);
server.listen(port, (err) => {
  if (err) {
    return console.log('Some error occurred', err);
  }

  console.log(`Server started at port ${port}`);
});

function getTitles(index, response) {
  if (index < sites.length) {
    getTitle(sites[index], response);
  } else {
    response.end(_prepareHTML(titles));
  }
}

function getTitle(site, response) {
  if (site.indexOf('http') === -1) {
    site = `http://${site}`;
  }

  if (site.indexOf('http://') >= 0) {
    http.get(site, (res) => {
      _fetchTitle(site, res, response);
    });
  } else {
    https.get(site, (res) => {
      _fetchTitle(site, res, response);
    });
  }
}

function _fetchTitle(site, res, response) {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 300 && res.statusCode < 400) {
      site = res.headers['location'];
      getTitle(site, response);
    } else if (res.statusCode >= 400) {
      titles.push(`${site} - NO RESPONSE`);
      getTitles(titles.length, response);
    } else {
      let title = data.match(/<title(.*)>/);
      if (title) {
        title = title[0];
        title = title.substr(title.indexOf('>') + 1, (title.indexOf('</title') - title.indexOf('>') - 1));
      } else {
        title = 'NO RESPONSE';
      }
      titles.push(`${site} - ${title}`);
      getTitles(titles.length, response);
    }
  });
}

function _prepareHTML(titles) {
  return `<html>
    <head></head>
    <body>
    <h1> Following are the titles of given websites: </h1>
    <ul>`
    +
    titles.map(title => `<li>${title}</li>`).join('');
    +
    `</ul>
  </body>
  </html>`;
}
