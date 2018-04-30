const http = require('http');
const https = require('https');
const url = require('url');
const port = 5000;

let titles = [], sites = [];

const requestHandler = (request, response) => {
  titles = [], sites = [];
  const requestUrl = request.url;
  if (requestUrl.indexOf('/I/want/title') >= 0) {
    const queryParams = url.parse(requestUrl, true).query;
    if (queryParams['address']) {
      sites = queryParams['address'].split(',');
      getTitles(0).then(titles => {
        response.end(_prepareHTML(titles));
      });
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

function getTitles(index) {
  return new Promise((resolve, reject) => {
    getTitlesPromise(index, resolve);
  });
}

function getTitlesPromise(index, resolve) {
  const _resolve = resolve;
  if (index < sites.length) {
    getTitle(sites[index]).then((index) => {
      getTitlesPromise(index, _resolve);
    });
  } else {
    _resolve(titles);
  }
}

function getTitle(site) {
  if (site.indexOf('http') === -1) {
    site = `http://${site}`;
  }

  if (site.indexOf('http://') >= 0) {
   return new Promise((resolve, reject) => {
     http.get(site, (res) => {
       _fetchTitle(site, res).then(title => {
         titles.push(title);
         resolve(titles.length);
       });
     });
   });
  } else {
    return new Promise((resolve, reject) => {
      https.get(site, (res) => {
        _fetchTitle(site, res).then(title => {
          titles.push(title);
          resolve(titles.length);
        });
      });
    });
  }
}

function _fetchTitle(site, res) {
  return new Promise((resolve, reject) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        newLocation = res.headers['location'];
        sites.splice(titles.length + 1, 0, newLocation);
        resolve('REDIRECTION-TITLE');
      } else if (res.statusCode >= 400) {
        titles.push(`${site} - NO RESPONSE`);
        resolve(titles.length);
      } else {
        let title = data.match(/<title(.*)>/);
        if (title) {
          title = title[0];
          title = title.substr(title.indexOf('>') + 1, (title.indexOf('</title') - title.indexOf('>') - 1));
        } else {
          title = 'NO RESPONSE';
        }
        resolve(`${site} - ${title}`);
      }
    });
  });
}

function _prepareHTML(titles) {
  return `<html>
    <head></head>
    <body>
    <h1> Following are the titles of given websites: </h1>
    <ul>`
    +
    titles.filter(title => title !== 'REDIRECTION-TITLE').map(title => `<li>${title}</li>`).join('');
    +
    `</ul>
  </body>
  </html>`;
}
