const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => page.close(), 1000);

describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a[href="/blogs"]');
  });

  canSeeTheForm();
  whenUsingInvalidInputs();
  whenUsingValidInputs();
});

describe('When user is not logged in', async () => {
  blogActionsNoAuth();
});

function canSeeTheForm() {
  test('Create-blog form is shown', async () => {
    await page.click('a[href="/blogs/new"]');
    const label = await page.getContentsOf('form label');

    expect(label).toEqual('Blog Title');
  });
}

// Invalid = Empty inputs
function whenUsingInvalidInputs() {
  describe('and using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('a[href="/blogs/new"]');
    });
    test('the form shows an error message', async () => {
      await page.click('form button[type="submit"]');
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });
}

// Adding valid values to the inputs
function whenUsingValidInputs() {
  describe('and using valid inputs', async () => {
    beforeEach(async () => {
      await page.click('a[href="/blogs/new"]');
      await page.type('input[name="title"]', 'test_title');
      await page.type('input[name="content"]', 'test_content');
      await page.click('form button[type="submit"]');
    });

    test('submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('submitting then saving adds blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');
      const title = await page.getContentsOf('span.card-title');
      const content = await page.getContentsOf('div.card-content p');

      expect(title).toEqual('test_title');
      expect(content).toEqual('test_content');
    });
  });
}

function blogActionsNoAuth() {
  const actions = [
    {
      method: 'get',
      url: '/api/blogs',
    },
    {
      method: 'post',
      url: '/api/blogs',
      body: { title: 't', content: 'c' },
    },
  ];
  test('Blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions);
    results.forEach((result) => expect(result).toEqual({ error: 'You must log in!' }));
  });
}
