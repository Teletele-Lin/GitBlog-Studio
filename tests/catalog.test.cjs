const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { build, formatDateTime, isMinuteTimestamp } = require('../docs/assets/catalog.js');
const data = require('../docs/assets/catalog.json');
const date = { createdAt: '2025-02-09T07:30Z', updatedAt: '2026-11-22T17:41Z' };
const sample = {
    site: { name: 'Example Blog', author: 'Example Author', brand: 'Example', timezone: 'Asia/Shanghai', heroTitle: 'Welcome', intro: 'Sample introduction', bio: 'Writer', github: { owner: 'example-user', repo: 'project-blog', branch: 'template' } },
    directories: [
        { id: 'notes', parent: '', title: '技术笔记', path: '/blogs/notes/overview', order: 10 },
        { id: 'sub', parent: 'notes', title: '子专题', path: '/blogs/notes/sub/overview', order: 30 },
        { id: 'journal', parent: '', title: '日记', path: '/blogs/journal/overview', order: 20 }
    ],
    articles: [
        { title: '笔记一', directory: 'notes', path: '/blogs/notes/one', order: 10, coverImage: '/assets/uploads/example.png', ...date },
        { title: '笔记二', directory: 'notes', path: '/blogs/notes/two', order: 20, ...date },
        { title: '子专题笔记', directory: 'sub', path: '/blogs/notes/sub/one', order: 10, ...date }
    ],
    featured: ['/blogs/notes/one']
};
const clone = () => structuredClone(sample);

function flatten(nodes) {
    return nodes.flatMap(node => [node, ...(node.children ? flatten(node.children) : [])]);
}

test('every existing article and directory remains reachable after the JSON migration', () => {
    const nodes = flatten(build(data).sections);
    const actual = new Set(nodes.map(node => node.path));
    function walk(directory) {
        return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
            const file = path.join(directory, entry.name);
            return entry.isDirectory() ? walk(file) : [file];
        });
    }
    const docs = path.resolve(__dirname, '../docs');
    const expected = new Set(walk(path.join(docs, 'blogs'))
        .filter(file => file.endsWith('.md'))
        .map(file => '/' + path.relative(docs, file).replaceAll(path.sep, '/').slice(0, -3)));
    assert.deepEqual(actual, expected);
    for (const item of data.featured) assert(nodes.some(node => node.path === item && !node.children));
});

test('sorting combines subdirectories and articles and keeps nested content under its parent', () => {
    const tree = build(sample);
    const notes = tree.sections.find(node => node.id === 'notes');
    assert.deepEqual(notes.children.map(node => node.title), ['笔记一', '笔记二', '子专题']);
    assert.equal(notes.children.at(-1).children.length, 1);
    assert.deepEqual(tree.sections.map(node => node.id), ['notes', 'journal']);
});

test('building a tree does not mutate data that the CMS edits', () => {
    const input = clone();
    build(input);
    assert.deepEqual(input, sample);
});

test('directory cycles are rejected even when a parent appears after its child', () => {
    const input = clone();
    input.directories.find(node => node.id === 'notes').parent = 'sub';
    assert.throws(() => build(input), /循环/);
});

test('missing parent directories and orphan article cards are rejected', () => {
    const first = clone(); first.directories[0].parent = 'missing';
    assert.throws(() => build(first), /找不到上级目录/);
    const second = clone(); second.articles[0].directory = 'missing';
    assert.throws(() => build(second), /文章所属目录/);
});

test('duplicate directory IDs, paths and routes with an optional .md suffix are rejected', () => {
    const first = clone(); first.directories[1].id = first.directories[0].id;
    assert.throws(() => build(first), /唯一/);
    const second = clone(); second.articles[1].path = second.articles[0].path + '.md';
    assert.throws(() => build(second), /重复路径/);
});

test('featured items must refer to articles rather than directories or missing paths', () => {
    const first = clone(); first.featured[0] = first.directories[0].path;
    assert.throws(() => build(first), /推荐阅读文章不存在/);
    const second = clone(); second.featured[0] = '/blogs/missing';
    assert.throws(() => build(second), /推荐阅读文章不存在/);
});

test('invalid document shapes, directory IDs and traversal paths are rejected', () => {
    assert.throws(() => build({}), /数组/);
    const first = clone(); first.directories[0].id = 'root';
    assert.throws(() => build(first), /唯一/);
    const second = clone(); second.articles[0].path = '/blogs/../assets/file';
    assert.throws(() => build(second), /有效的文章路径/);
});

test('all articles have lifecycle times at minute precision and inherit the default author', () => {
    const tree = build(data);
    assert.equal(tree.site.author, data.site.author);
    assert.equal(tree.site.timezone, data.site.timezone);
    for (const article of flatten(tree.sections).filter(node => !node.children)) {
        assert.ok(isMinuteTimestamp(article.createdAt), article.title);
        assert.ok(isMinuteTimestamp(article.updatedAt), article.title);
        assert.ok(article.updatedAt >= article.createdAt);
        assert.ok(article.author);
    }
    assert.equal(formatDateTime('2026-11-22T17:41Z', 'Asia/Shanghai'), '2026-11-23 01:41');
    assert.equal(formatDateTime('2025-02-09T07:30Z', 'UTC'), '2025-02-09 07:30');
    assert.equal(isMinuteTimestamp('2025-02-30T07:30Z'), false);
    assert.equal(isMinuteTimestamp('2025-02-09T07:30:55Z'), false);
});

test('catalog validates times, accepts older entries without dates, and supports an author override', () => {
    const input = clone();
    input.articles[0].author = 'Guest';
    assert.equal(flatten(build(input).sections).find(n => n.path === input.articles[0].path).author, 'Guest');
    input.articles[0].updatedAt = '2000-01-01T00:00Z';
    assert.throws(() => build(input), /更新时间不能早于/);
    input.articles[0].updatedAt = 'not a date';
    assert.throws(() => build(input), /UTC 分钟格式/);
    delete input.articles[0].createdAt; delete input.articles[0].updatedAt; delete input.site;
    assert.equal(build(input).site.author, '博主');
    const invalidSite = clone(); invalidSite.site.timezone = 'Invalid/Zone';
    assert.throws(() => build(invalidSite), /未知的时区/);
});

test('blog renders author and minute timestamps on article header and update time on article cards', async () => {
    const vm = require('node:vm');
    const catalog = require('../docs/assets/catalog.js');
    const input = clone();
    input.articles[0].author = 'Guest <Writer>';
    const target = input.articles[0];
    const site = { ...catalog, ready: Promise.resolve(catalog.build(input)) };
    const context = vm.createContext({
        window: { TeleteleCatalog: site },
        document: { addEventListener() {}, querySelector() { return null; }, baseURI: 'https://example-user.github.io/project-blog/' },
        console, URL
    });
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../docs/assets/navigation.js'), 'utf8'), context);
    let before;
    const route = { path: target.path };
    context.window.TeleteleUI.install({
        init() {}, mounted() {}, doneEach() {}, beforeEach(callback) { before = callback; }
    }, { route });
    const result = await new Promise(resolve => before('# Test', resolve));
    assert.match(result, /class="article-author">Guest &lt;Writer&gt;/);
    assert.ok(result.includes('创建于 <time datetime="' + target.createdAt + '"'));
    assert.ok(result.includes('最近更新于 <time datetime="' + target.updatedAt + '"'));
    assert.ok(result.includes(formatDateTime(target.updatedAt, input.site.timezone)));
    route.path = input.directories.find(d => d.id === target.directory).path;
    const cards = await new Promise(resolve => before('<div data-catalog="' + target.directory + '"></div>', resolve));
    assert.match(cards, /class="card-date"/);
    assert.ok(cards.includes('更新于 <time datetime="' + target.updatedAt + '"'));
    assert.doesNotMatch(cards, /class="article-author"/);
    assert.ok(cards.includes('src="https://example-user.github.io/project-blog/assets/uploads/example.png"'));
    route.path = '/';
    const home = await new Promise(resolve => before('<div data-site-hero></div>\n<div data-site-footer></div>', resolve));
    assert.ok(home.includes('Welcome'));
    assert.ok(home.includes('Example Author'));
    assert.ok(home.includes('https://github.com/example-user'));
    assert.equal(context.document.title, 'Example Blog');
});
