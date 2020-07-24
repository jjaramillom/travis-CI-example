const puppeteer = require('puppeteer');
const userFactory = require('../factories/userFactory');
const sessionFactory = require('../factories/sessionFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    // page = await browser.newPage();
    const page = (await browser.pages())[0];
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: (target, property) => customPage[property] || page[property] || browser[property],
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    const cookies = [
      { name: 'session', value: session },
      { name: 'session.sig', value: sig },
    ];

    await this.page.setCookie(...cookies);
    await this.page.reload();
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }

  get(url) {
    return this.page.evaluate((_url) => {
      return fetch(_url, {
        method: 'GET',
        credentials: 'same-origin',
      }).then((res) => res.json());
    }, url);
  }

  post(url, body) {
    return this.page.evaluate(
      (_url, _body) => {
        return fetch(_url, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(_body),
        }).then((res) => res.json());
      },
      url,
      body
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(async ({ method, url, body }) => {
        return this[method](url, body);
      })
    );
  }
}

module.exports = CustomPage;
