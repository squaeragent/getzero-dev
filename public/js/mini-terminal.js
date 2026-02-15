/**
 * Mini Terminal — homepage embedded command interface
 * Subset of /terminal commands, lightweight
 */
(function() {
  'use strict';
  var output = document.getElementById('miniterm-output');
  var input = document.getElementById('miniterm-input');
  if (!output || !input) return;

  var cache = {};
  var history = [];
  var histIdx = 0;
  var MAX_LINES = 40;

  function fetchJSON(url) {
    if (cache[url]) return Promise.resolve(cache[url]);
    return fetch(url).then(function(r) { return r.json(); }).then(function(d) {
      cache[url] = d;
      return d;
    }).catch(function() { return null; });
  }

  function pad(s, n) { return (s + '').padEnd(n); }
  function dots(label, val, w) {
    w = w || 26;
    var d = '.'.repeat(Math.max(2, w - label.length - (val + '').length));
    return '  ' + label + ' ' + d + ' ' + val;
  }

  function print(text) {
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var div = document.createElement('div');
      div.textContent = lines[i];
      output.appendChild(div);
    }
    // Trim
    while (output.children.length > MAX_LINES) {
      output.removeChild(output.firstChild);
    }
    output.scrollTop = output.scrollHeight;
  }

  var commands = {
    help: function() {
      return Promise.resolve(
        'COMMANDS\n' +
        '  help     status   agents\n' +
        '  revenue  price    feed\n' +
        '  version  clear\n' +
        '  cd <path>  — navigate'
      );
    },

    status: function() {
      return fetchJSON('/svc/status.json').then(function(s) {
        return fetchJSON('/svc/metrics.json').then(function(m) {
          if (!s && !m) return 'ERROR: no data';
          var day = (m && m.day) || (s && s.metrics && s.metrics.day) || '?';
          var agents = (s && s.system && s.system.agents_live) || 5;
          var rev = (m && m.revenue) || 33343;
          return 'ZERO OS — OPERATIONAL\n' +
            dots('Day', day) + '\n' +
            dots('Agents', agents + '/5') + '\n' +
            dots('Revenue', '$' + rev.toLocaleString());
        });
      });
    },

    agents: function() {
      var a = [
        ['SERAPHIM',  'cortex'],
        ['CHRONICLE', 'editorial'],
        ['AESTHETE',  'visual'],
        ['SQUAER',    'distribution'],
        ['SENTINEL',  'integrity'],
      ];
      var out = 'COGNITIVE MESH\n';
      for (var i = 0; i < a.length; i++) {
        out += '  ● ' + pad(a[i][0], 12) + a[i][1] + '\n';
      }
      return Promise.resolve(out.trimEnd());
    },

    revenue: function() {
      return fetchJSON('/svc/revenue.json').then(function(d) {
        if (!d) return 'Revenue data unavailable.';
        var rev = d.lp_commissions_total || 33343;
        var vol = d.volume_24h ? '$' + Math.round(d.volume_24h).toLocaleString() : '—';
        return 'REVENUE\n' +
          dots('LP Total', '$' + rev.toLocaleString()) + '\n' +
          dots('24h Vol', vol);
      });
    },

    price: function() {
      return fetchJSON('/svc/revenue.json').then(function(d) {
        if (!d || !d.token_price_usd) return 'Price unavailable.';
        var p = '$' + d.token_price_usd.toFixed(8);
        var c = d.price_change_24h != null ? (d.price_change_24h > 0 ? '+' : '') + d.price_change_24h + '%' : '—';
        return '$SQUAER\n' + dots('Price', p) + '\n' + dots('24h', c);
      });
    },

    feed: function() {
      return fetchJSON('/svc/feed.json').then(function(raw) {
        var f = (raw && raw.entries) || raw;
        if (!f || !f.length) return 'No feed data.';
        var out = 'ACTIVITY\n';
        for (var i = 0; i < Math.min(4, f.length); i++) {
          var t = new Date(f[i].time);
          var ts = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
          out += '  ' + ts + ' ' + pad(f[i].agent || 'SYS', 10) + (f[i].action || '') + '\n';
        }
        return out.trimEnd();
      });
    },

    version: function() {
      return fetchJSON('/svc/metrics.json').then(function(m) {
        var day = (m && m.day) || '?';
        var rev = (m && m.revenue) ? '$' + m.revenue.toLocaleString() : '—';
        return 'ZERO OS v0.9.1\nDay ' + day + ' · 5 agents · ' + rev + ' revenue';
      });
    },

    cd: function(args) {
      var routes = {
        '/': '/', 'home': '/',
        'agents': '/agents', 'system': '/system',
        'intel': '/intel', 'manifesto': '/manifesto',
        'product': '/product', 'build-log': '/build-log',
        'journal': '/build-log', 'live': '/live',
        'subscribe': '/subscribe', 'predictions': '/predictions',
        'terminal': '/terminal',
      };
      var t = args[0];
      if (!t) return Promise.resolve('cd <path> — e.g. cd agents');
      var r = routes[t] || routes[t.replace(/^\//, '')];
      if (r) {
        setTimeout(function() { window.location.href = r; }, 400);
        return Promise.resolve('→ ' + r);
      }
      return Promise.resolve('Not found: ' + t);
    },

    clear: function() {
      output.innerHTML = '';
      return Promise.resolve(null);
    }
  };

  var eggs = {
    'whoami': 'VISITOR — read-only',
    'sudo': 'Access denied.',
    'ls': 'agents/ build-log/ intel/ system/',
    'pwd': '/zero/terminal',
    'ping': 'PONG',
    'exit': 'There is no exit.',
  };

  function exec(raw) {
    var parts = raw.trim().split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (!cmd) return;

    print('$ ' + raw);

    if (commands[cmd]) {
      commands[cmd](args).then(function(result) {
        if (result) print(result);
      });
    } else if (eggs[cmd] || eggs[raw.toLowerCase()]) {
      print(eggs[cmd] || eggs[raw.toLowerCase()]);
    } else {
      print("Unknown: " + cmd + ". Try 'help'.");
    }
  }

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var v = input.value;
      if (v.trim()) {
        history.push(v);
        histIdx = history.length;
      }
      input.value = '';
      exec(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
      else { histIdx = history.length; input.value = ''; }
    }
  });

  // "/" hotkey to focus mini terminal (desktop)
  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      input.focus();
    }
  });

  // Boot message
  print('ZERO OS v0.9.1 — type help');
})();
