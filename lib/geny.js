/*jshint multistr: true */

var Handlebars = require('handlebars'),
            fs = require('fs-extra'),
             _ = require('./_utils'),
             Geny, Jail, VerifyJail, DestroyJail;




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
  var boomJail = new DestroyJail(rootDir);

  this.ctrl.apply(boomJail, args);

  return this;
};

Geny.prototype.verify = function () {
  var rootDir = arguments[0],
        args  = Array.prototype.splice.call(arguments, 1);

  // ctrl(...., data={})
  args.push({});

  var opts = {
    ok: true
  };

  var verifyJail = new VerifyJail(rootDir, opts);

  this.ctrl.apply(verifyJail, args);

  return opts.ok;
};

function jailFactory(obj) {

  var StubJail = function (rootDir, opts) {
    this.opts = opts = opts || {};
    this.rootDir = _.normalizeDir(rootDir);
    this._hooks = [];
  };

  var handleHooks = function () {
    var hook, hooks, len, i, res, tRes;

    hooks = this._hooks;
    len = hooks.length;
    for (i = 0; i < len; i++) {
      hook = hooks[i];
      tRes = hook.apply(this, arguments);
      if (i === 0) {
        res = tRes;
      } else {
        res = res && tRes;
      }
    }

    return res;
  };

  StubJail.prototype.hook = function (fn) {
    this._hooks.push(fn);
  };

  if (obj.dir) {
    StubJail.prototype.dir = function (name, fn) {
      if (handleHooks.call(this, 'dir', name) === false) {
        return;
      }

      var newJail = new StubJail(this.rootDir + _.normalizeDir(name), this.opts);

      obj.dir.apply(this, arguments);

      if (fn) {
        fn.call(newJail);
      }
    };
  }

  if (obj.file) {
    StubJail.prototype.file = function (name) {
      if (handleHooks.call(this, 'file', name) === false) {
        return;
      }

      obj.file.apply(this, arguments);
    };
  }

  return StubJail;
}


Jail = jailFactory({
  dir: function (name) {
    fs.mkdirpSync(this.rootDir + name);
  },
  file: function (name, opts) {
    var template = opts.template;

    switch (typeof(template)) {
      case 'string':
        template = Handlebars.compile(template);
        break;
      case 'function':
        break;
      default:
        throw new Error('template should be either a Handlebars function or a string');
    }

    fs.outputFileSync(this.rootDir + name, template(opts.data));
  }
});

DestroyJail = jailFactory({
  dir: function (name) {
    fs.removeSync(this.rootDir + name);
  },
  file: function (name) {
    fs.removeSync(this.rootDir + name);
  }
});

VerifyJail = jailFactory({
  dir: function (name) {
    var dir  = this.rootDir + name,
        opts = this.opts;

    opts.ok = opts.ok && fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  },
  file: function (name) {
    var file = this.rootDir + name,
        opts = this.opts;

    opts.ok = opts.ok && fs.existsSync(file) && fs.statSync(file).isFile();
  }
});


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