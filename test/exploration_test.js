/* global describe */
/* global it */

require('should');

var geny = require('../lib/geny');
var fs = require('fs');

var ROOT_DIR = __dirname + '/';

// Nested Template with custom logic
var tNodeProject = geny(function (projectName, data) {
  var projectNameFile = geny.camelCased(projectName) + '.js';

  // lib/myProject.js
  data.main = 'lib/' + projectNameFile;

  this.dir(projectName, function () {
    this.dir('bin');
    this.dir('lib', function () {
      this.file(projectNameFile, {
        template: fs.readFileSync(ROOT_DIR + 'templates/myProject.js.hbs').toString(),
        data: { name: projectName }
      });
    });
    this.file('package.json', {
      template: fs.readFileSync(ROOT_DIR + 'templates/package.json.hbs').toString(),
      data: data
    });
  });
});

// Plain Template
var tGreeter = geny(function (data) {
  this.file('zoo/human/msg.txt', {
    template: fs.readFileSync(ROOT_DIR + 'templates/human.txt.hbs').toString(),
    data: data
  });

  this.dir('zoo/cat', function () {
    this.file('msg.txt', {
      template: fs.readFileSync(ROOT_DIR + 'templates/cat.txt.hbs').toString(),
      data: data
    });
  });

  this.dir('zoo', function () {
    this.dir('dog', function () {
      this.file('msg.txt', {
        template: fs.readFileSync(ROOT_DIR + 'templates/dog.txt.hbs').toString(),
        data: data
      });
    });
  });

  this.dir('zoo', function () {
    this.file('cow/msg.txt', {
      template: fs.readFileSync(ROOT_DIR + 'templates/cow.txt.hbs').toString(),
      data: data
    });
  });
});

describe('geny.js', function () {
  afterEach(function () {
    tGreeter.destroy(ROOT_DIR);
    tNodeProject.destroy(ROOT_DIR, 'my-project');
  });

  it('should create project structure from nested template', function () {
    tNodeProject.create(ROOT_DIR, 'my-project', {
      name: 'My Project',
      version: '0.1.0',
      description: 'Simple node.js project generated',
      license: 'BSD-2-Clause'
    });

    fs.existsSync(ROOT_DIR + 'my-project/bin').should.be.true;
    fs.existsSync(ROOT_DIR + 'my-project/lib').should.be.true;
    fs.existsSync(ROOT_DIR + 'my-project/lib/myProject.js').should.be.true;
    fs.existsSync(ROOT_DIR + 'my-project/package.json').should.be.true;
  });
  it('should create project structure from plain template', function () {
    tGreeter.create(ROOT_DIR, {
      name: 'Luke'
    });

    fs.existsSync(ROOT_DIR + 'zoo/human/msg.txt').should.be.true;
    fs.existsSync(ROOT_DIR + 'zoo/cat/msg.txt').should.be.true;
    fs.existsSync(ROOT_DIR + 'zoo/dog/msg.txt').should.be.true;
    fs.existsSync(ROOT_DIR + 'zoo/cow/msg.txt').should.be.true;
  });
  it('should create files from file-templates', function () {
    tGreeter.create(ROOT_DIR, {
      name: 'Luke'
    });

    fs.readFileSync(ROOT_DIR + 'zoo/human/msg.txt').toString().should.eql('Greetings, Luke!');
  });
  it('#destroy should destroy the project', function () {
    tGreeter.create(ROOT_DIR, {
      name: 'Luke'
    });

    tGreeter.destroy(ROOT_DIR);

    fs.existsSync(ROOT_DIR + 'zoo/human/msg.txt').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/human').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/cat/msg.txt').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/cat').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/dog/msg.txt').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/dog').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/cow/msg.txt').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo/cow').should.be.false;
    fs.existsSync(ROOT_DIR + 'zoo').should.be.false;
  });

  it('should create empty file, if no template was specified');

  it("#verify() - should verify the project's structure", function () {
    tGreeter.create(ROOT_DIR, {
      name: 'Verify'
    });
    tGreeter.verify(ROOT_DIR).should.be.true;
    tNodeProject.verify(ROOT_DIR, 'verify-project').should.be.false;
  });
});