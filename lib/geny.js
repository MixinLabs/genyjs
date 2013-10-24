/*jshint multistr: true */

var Handlebars = require('handlebars'),
            fs = require('fs-extra'),
             _ = require('./_utils'),
             Geny, Jail;




Geny = function (ctrl) {
 this.ctrl = ctrl;
};

Geny.prototype.create = function () {
 var rootDir = arguments[0],
     args    = Array.prototype.splice.call(arguments, 1),
     jail    = new Jail(rootDir);

 this.ctrl.apply(jail, args);

 return this;
};

Geny.prototype.destroy = function () {
  var rootDir = arguments[0],
      args    = Array.prototype.splice.call(arguments, 1);

  // ctrl(...., data={})
  args.push({});

  // self-destructing jail
  var boomJail = new Jail(rootDir, {
    dirAction: Jail.prototype.removeDir,
    fileAction: Jail.prototype.removeFile
  });

  this.ctrl.apply(boomJail, args);

  return this;
};

Geny.prototype.verify = function () {
  var rootDir = arguments[0],
        args  = Array.prototype.splice.call(arguments, 1);

  // ctrl(...., data={})
  args.push({});

  var opts = {
    dirAction: Jail.prototype.verifyDir,
    fileAction: Jail.prototype.verifyFile,
    ok: true
  };

  var verifyJail = new Jail(rootDir, opts);

  this.ctrl.apply(verifyJail, args);

  return opts.ok;
};

// TODO Abstract three Jails (Verify, Destroy, Create)
// "jail" for `this` scope, used in #dir(), #file() methods
Jail = function (rootDir, opts) {
  this.opts = opts = opts || {};
  this.rootDir = _.normalizeDir(rootDir);
  this.opts.dirAction = opts.dirAction || this.createDir;
  this.opts.fileAction = opts.fileAction || this.createFile;
};

Jail.prototype.dir = function (name, fn) {
  this.opts.dirAction.call(this, name);

  if (fn) {
    fn.call(new Jail(this.rootDir + _.normalizeDir(name), this.opts));
  }
};

Jail.prototype.file = function (name, opts) {
  this.opts.fileAction.call(this, name, opts);
};

Jail.prototype.createDir = function (name) {
  return fs.mkdirpSync(this.rootDir + name);
};

Jail.prototype.createFile = function (name, opts) {
  var template = opts.template;
  // Better error message on compile
  switch (typeof(template)) {
    case 'string':
      template = Handlebars.compile(template);
      break;
    case 'function':
      break;
    default:
      throw new Error('template should be either a Handlebars function or a string');
  }

  return fs.outputFileSync(this.rootDir + name, template(opts.data));
};

Jail.prototype.removeFile = function (name) {
  return fs.removeSync(this.rootDir + name);
};

Jail.prototype.removeDir = function (name) {
  return fs.removeSync(this.rootDir + name);
};

Jail.prototype.verifyFile = function (name) {
  var file = this.rootDir + name;
      opts = this.opts;
  opts.ok = opts.ok && fs.existsSync(file) && fs.statSync(file).isFile();
};

Jail.prototype.verifyDir = function (name) {
  var dir  = this.rootDir + name,
      opts = this.opts;

  opts.ok = opts.ok && fs.existsSync(dir) && fs.statSync(dir).isDirectory();
};


var genyFactory = function (ctrl) {
  return new Geny(ctrl);
};

// http://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
genyFactory.camelCased = function (s) {
  return s.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
};
genyFactory.dasherized = function (s) {
  return s.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '-' + g[1].toLowerCase(); });
};

module.exports = genyFactory;