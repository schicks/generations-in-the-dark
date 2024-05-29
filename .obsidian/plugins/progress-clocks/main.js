"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const obsidian = require("obsidian");
const view = require("@codemirror/view");
const language = require("@codemirror/language");
function noop() {
}
const identity = (x) => x;
function assign(tar, src) {
  for (const k in src)
    tar[k] = src[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;
    for (let i = 0; i < length; i++) {
      dirty[i] = -1;
    }
    return dirty;
  }
  return -1;
}
function exclude_internal_props(props) {
  const result = {};
  for (const k in props)
    if (k[0] !== "$")
      result[k] = props[k];
  return result;
}
function compute_rest_props(props, keys) {
  const rest = {};
  keys = new Set(keys);
  for (const k in props)
    if (!keys.has(k) && k[0] !== "$")
      rest[k] = props[k];
  return rest;
}
function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function append(target, node) {
  target.appendChild(node);
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
  return style.sheet;
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
  return function(event) {
    event.preventDefault();
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function set_svg_attributes(node, attributes) {
  for (const key in attributes) {
    attr(node, key, attributes[key]);
  }
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data)
    return;
  text2.data = data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
const managed_styles = /* @__PURE__ */ new Map();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
function create_style_information(doc, node) {
  const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info);
  return info;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(
    name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1
  );
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info) => {
      const { ownerNode } = info.stylesheet;
      if (ownerNode)
        detach(ownerNode);
    });
    managed_styles.clear();
  });
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail, { cancelable = false } = {}) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail, { cancelable });
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
      return !event.defaultPrevented;
    }
    return true;
  };
}
const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}
let promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
const outroing = /* @__PURE__ */ new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
  const options = { direction: "both" };
  let config = fn(node, params, options);
  let t = intro ? 0 : 1;
  let running_program = null;
  let pending_program = null;
  let animation_name = null;
  function clear_animation() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function init2(program, duration) {
    const d = program.b - t;
    duration *= Math.abs(d);
    return {
      a: t,
      b: program.b,
      d,
      duration,
      start: program.start,
      end: program.start + duration,
      group: program.group
    };
  }
  function go(b) {
    const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
    const program = {
      start: now() + delay,
      b
    };
    if (!b) {
      program.group = outros;
      outros.r += 1;
    }
    if (running_program || pending_program) {
      pending_program = program;
    } else {
      if (css) {
        clear_animation();
        animation_name = create_rule(node, t, b, duration, delay, easing, css);
      }
      if (b)
        tick2(0, 1);
      running_program = init2(program, duration);
      add_render_callback(() => dispatch(node, b, "start"));
      loop((now2) => {
        if (pending_program && now2 > pending_program.start) {
          running_program = init2(pending_program, duration);
          pending_program = null;
          dispatch(node, running_program.b, "start");
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
          }
        }
        if (running_program) {
          if (now2 >= running_program.end) {
            tick2(t = running_program.b, 1 - t);
            dispatch(node, running_program.b, "end");
            if (!pending_program) {
              if (running_program.b) {
                clear_animation();
              } else {
                if (!--running_program.group.r)
                  run_all(running_program.group.c);
              }
            }
            running_program = null;
          } else if (now2 >= running_program.start) {
            const p = now2 - running_program.start;
            t = running_program.a + running_program.d * easing(p / running_program.duration);
            tick2(t, 1 - t);
          }
        }
        return !!(running_program || pending_program);
      });
    }
  }
  return {
    run(b) {
      if (is_function(config)) {
        wait().then(() => {
          config = config(options);
          go(b);
        });
      } else {
        go(b);
      }
    },
    end() {
      clear_animation();
      running_program = pending_program = null;
    }
  };
}
function get_spread_update(levels, updates) {
  const update2 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n))
          to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update2[key] = n[key];
          accounted_for[key] = 1;
        }
      }
      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update2))
      update2[key] = void 0;
  }
  return update2;
}
function get_spread_object(spread_props) {
  return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
}
function bind(component, name, callback) {
  const index = component.$$.props[name];
  if (index !== void 0) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
class State {
  constructor() {
    __publicField(this, "debug", false);
    __publicField(this, "sections");
  }
}
/**
 * @license lucide-svelte v0.331.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const defaultAttributes$1 = defaultAttributes;
function get_each_context$4(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i][0];
  child_ctx[11] = list[i][1];
  return child_ctx;
}
function create_dynamic_element(ctx) {
  let svelte_element;
  let svelte_element_levels = [ctx[11]];
  let svelte_element_data = {};
  for (let i = 0; i < svelte_element_levels.length; i += 1) {
    svelte_element_data = assign(svelte_element_data, svelte_element_levels[i]);
  }
  return {
    c() {
      svelte_element = svg_element(ctx[10]);
      set_svg_attributes(svelte_element, svelte_element_data);
    },
    m(target, anchor) {
      insert(target, svelte_element, anchor);
    },
    p(ctx2, dirty) {
      set_svg_attributes(svelte_element, svelte_element_data = get_spread_update(svelte_element_levels, [dirty & 32 && ctx2[11]]));
    },
    d(detaching) {
      if (detaching)
        detach(svelte_element);
    }
  };
}
function create_each_block$4(ctx) {
  let previous_tag = ctx[10];
  let svelte_element_anchor;
  let svelte_element = ctx[10] && create_dynamic_element(ctx);
  return {
    c() {
      if (svelte_element)
        svelte_element.c();
      svelte_element_anchor = empty();
    },
    m(target, anchor) {
      if (svelte_element)
        svelte_element.m(target, anchor);
      insert(target, svelte_element_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (ctx2[10]) {
        if (!previous_tag) {
          svelte_element = create_dynamic_element(ctx2);
          previous_tag = ctx2[10];
          svelte_element.c();
          svelte_element.m(svelte_element_anchor.parentNode, svelte_element_anchor);
        } else if (safe_not_equal(previous_tag, ctx2[10])) {
          svelte_element.d(1);
          svelte_element = create_dynamic_element(ctx2);
          previous_tag = ctx2[10];
          svelte_element.c();
          svelte_element.m(svelte_element_anchor.parentNode, svelte_element_anchor);
        } else {
          svelte_element.p(ctx2, dirty);
        }
      } else if (previous_tag) {
        svelte_element.d(1);
        svelte_element = null;
        previous_tag = ctx2[10];
      }
    },
    d(detaching) {
      if (detaching)
        detach(svelte_element_anchor);
      if (svelte_element)
        svelte_element.d(detaching);
    }
  };
}
function create_fragment$h(ctx) {
  var _a;
  let svg;
  let each_1_anchor;
  let svg_stroke_width_value;
  let svg_class_value;
  let current;
  let each_value = ctx[5];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
  }
  const default_slot_template = ctx[9].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[8], null);
  let svg_levels = [
    defaultAttributes$1,
    ctx[6],
    { width: ctx[2] },
    { height: ctx[2] },
    { stroke: ctx[1] },
    {
      "stroke-width": svg_stroke_width_value = ctx[4] ? Number(ctx[3]) * 24 / Number(ctx[2]) : ctx[3]
    },
    {
      class: svg_class_value = `lucide-icon lucide lucide-${ctx[0]} ${(_a = ctx[7].class) != null ? _a : ""}`
    }
  ];
  let svg_data = {};
  for (let i = 0; i < svg_levels.length; i += 1) {
    svg_data = assign(svg_data, svg_levels[i]);
  }
  return {
    c() {
      svg = svg_element("svg");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
      if (default_slot)
        default_slot.c();
      set_svg_attributes(svg, svg_data);
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(svg, null);
        }
      }
      append(svg, each_1_anchor);
      if (default_slot) {
        default_slot.m(svg, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      var _a2;
      if (dirty & 32) {
        each_value = ctx2[5];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$4(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$4(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(svg, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 256)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[8],
            !current ? get_all_dirty_from_scope(ctx2[8]) : get_slot_changes(default_slot_template, ctx2[8], dirty, null),
            null
          );
        }
      }
      set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
        defaultAttributes$1,
        dirty & 64 && ctx2[6],
        (!current || dirty & 4) && { width: ctx2[2] },
        (!current || dirty & 4) && { height: ctx2[2] },
        (!current || dirty & 2) && { stroke: ctx2[1] },
        (!current || dirty & 28 && svg_stroke_width_value !== (svg_stroke_width_value = ctx2[4] ? Number(ctx2[3]) * 24 / Number(ctx2[2]) : ctx2[3])) && { "stroke-width": svg_stroke_width_value },
        (!current || dirty & 129 && svg_class_value !== (svg_class_value = `lucide-icon lucide lucide-${ctx2[0]} ${(_a2 = ctx2[7].class) != null ? _a2 : ""}`)) && { class: svg_class_value }
      ]));
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(svg);
      destroy_each(each_blocks, detaching);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$h($$self, $$props, $$invalidate) {
  const omit_props_names = ["name", "color", "size", "strokeWidth", "absoluteStrokeWidth", "iconNode"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let { $$slots: slots = {}, $$scope } = $$props;
  let { name } = $$props;
  let { color = "currentColor" } = $$props;
  let { size = 24 } = $$props;
  let { strokeWidth = 2 } = $$props;
  let { absoluteStrokeWidth = false } = $$props;
  let { iconNode } = $$props;
  $$self.$$set = ($$new_props) => {
    $$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    $$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("name" in $$new_props)
      $$invalidate(0, name = $$new_props.name);
    if ("color" in $$new_props)
      $$invalidate(1, color = $$new_props.color);
    if ("size" in $$new_props)
      $$invalidate(2, size = $$new_props.size);
    if ("strokeWidth" in $$new_props)
      $$invalidate(3, strokeWidth = $$new_props.strokeWidth);
    if ("absoluteStrokeWidth" in $$new_props)
      $$invalidate(4, absoluteStrokeWidth = $$new_props.absoluteStrokeWidth);
    if ("iconNode" in $$new_props)
      $$invalidate(5, iconNode = $$new_props.iconNode);
    if ("$$scope" in $$new_props)
      $$invalidate(8, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [
    name,
    color,
    size,
    strokeWidth,
    absoluteStrokeWidth,
    iconNode,
    $$restProps,
    $$props,
    $$scope,
    slots
  ];
}
class Icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$h, create_fragment$h, safe_not_equal, {
      name: 0,
      color: 1,
      size: 2,
      strokeWidth: 3,
      absoluteStrokeWidth: 4,
      iconNode: 5
    });
  }
}
const Icon$1 = Icon;
function create_default_slot$9(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$g(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [
    { name: "arrow-down-from-line" },
    ctx[1],
    { iconNode: ctx[0] }
  ];
  let icon_props = {
    $$slots: { default: [create_default_slot$9] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$g($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    ["path", { "d": "M19 3H5" }],
    ["path", { "d": "M12 21V7" }],
    ["path", { "d": "m6 15 6 6 6-6" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Arrow_down_from_line extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$g, create_fragment$g, safe_not_equal, {});
  }
}
const ArrowDownFromLine = Arrow_down_from_line;
function create_default_slot$8(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$f(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [
    { name: "arrow-up-from-line" },
    ctx[1],
    { iconNode: ctx[0] }
  ];
  let icon_props = {
    $$slots: { default: [create_default_slot$8] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$f($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    ["path", { "d": "m18 9-6-6-6 6" }],
    ["path", { "d": "M12 3v14" }],
    ["path", { "d": "M5 21h14" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Arrow_up_from_line extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$f, create_fragment$f, safe_not_equal, {});
  }
}
const ArrowUpFromLine = Arrow_up_from_line;
function create_default_slot$7(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$e(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [
    { name: "minus-square" },
    ctx[1],
    { iconNode: ctx[0] }
  ];
  let icon_props = {
    $$slots: { default: [create_default_slot$7] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$e($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2"
      }
    ],
    ["path", { "d": "M8 12h8" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Minus_square extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$e, create_fragment$e, safe_not_equal, {});
  }
}
const MinusSquare = Minus_square;
function create_default_slot$6(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$d(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "pause" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot$6] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$d($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "width": "4",
        "height": "16",
        "x": "6",
        "y": "4"
      }
    ],
    [
      "rect",
      {
        "width": "4",
        "height": "16",
        "x": "14",
        "y": "4"
      }
    ]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Pause extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$d, create_fragment$d, safe_not_equal, {});
  }
}
const Pause$1 = Pause;
function create_default_slot$5(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$c(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "pie-chart" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot$5] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$c($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    ["path", { "d": "M21.21 15.89A10 10 0 1 1 8 2.83" }],
    ["path", { "d": "M22 12A10 10 0 0 0 12 2v10z" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Pie_chart extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$c, create_fragment$c, safe_not_equal, {});
  }
}
const PieChart = Pie_chart;
function create_default_slot$4(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$b(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "play" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot$4] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$b($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [["polygon", { "points": "5 3 19 12 5 21 5 3" }]];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Play extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
  }
}
const Play$1 = Play;
function create_default_slot$3(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$a(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "plus-square" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot$3] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$a($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2"
      }
    ],
    ["path", { "d": "M8 12h8" }],
    ["path", { "d": "M12 8v8" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Plus_square extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$a, create_fragment$a, safe_not_equal, {});
  }
}
const PlusSquare = Plus_square;
function create_default_slot$2(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$9(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "refresh-ccw" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot$2] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$9($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
      }
    ],
    ["path", { "d": "M3 3v5h5" }],
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
      }
    ],
    ["path", { "d": "M16 16h5v5" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Refresh_ccw extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$9, create_fragment$9, safe_not_equal, {});
  }
}
const RefreshCcw = Refresh_ccw;
function create_default_slot$1(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$8(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "timer" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot$1] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$8($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    [
      "line",
      {
        "x1": "10",
        "x2": "14",
        "y1": "2",
        "y2": "2"
      }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "15",
        "y1": "14",
        "y2": "11"
      }
    ],
    ["circle", { "cx": "12", "cy": "14", "r": "8" }]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Timer extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
  }
}
const Timer$1 = Timer;
function create_default_slot(ctx) {
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[3], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            ctx2[3],
            !current ? get_all_dirty_from_scope(ctx2[3]) : get_slot_changes(default_slot_template, ctx2[3], dirty, null),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment$7(ctx) {
  let icon;
  let current;
  const icon_spread_levels = [{ name: "trash-2" }, ctx[1], { iconNode: ctx[0] }];
  let icon_props = {
    $$slots: { default: [create_default_slot] },
    $$scope: { ctx }
  };
  for (let i = 0; i < icon_spread_levels.length; i += 1) {
    icon_props = assign(icon_props, icon_spread_levels[i]);
  }
  icon = new Icon$1({ props: icon_props });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const icon_changes = dirty & 3 ? get_spread_update(icon_spread_levels, [
        icon_spread_levels[0],
        dirty & 2 && get_spread_object(ctx2[1]),
        dirty & 1 && { iconNode: ctx2[0] }
      ]) : {};
      if (dirty & 8) {
        icon_changes.$$scope = { dirty, ctx: ctx2 };
      }
      icon.$set(icon_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function instance$7($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const iconNode = [
    ["path", { "d": "M3 6h18" }],
    [
      "path",
      {
        "d": "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
      }
    ],
    [
      "path",
      {
        "d": "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
      }
    ],
    [
      "line",
      {
        "x1": "10",
        "x2": "10",
        "y1": "11",
        "y2": "17"
      }
    ],
    [
      "line",
      {
        "x1": "14",
        "x2": "14",
        "y1": "11",
        "y2": "17"
      }
    ]
  ];
  $$self.$$set = ($$new_props) => {
    $$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("$$scope" in $$new_props)
      $$invalidate(3, $$scope = $$new_props.$$scope);
  };
  $$props = exclude_internal_props($$props);
  return [iconNode, $$props, slots, $$scope];
}
class Trash_2 extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$7, create_fragment$7, safe_not_equal, {});
  }
}
const Trash2 = Trash_2;
function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * o}`
  };
}
function ifClickEquivalent(fn) {
  return (e) => {
    if (["Enter", " "].contains(e.key)) {
      fn(e);
      e.preventDefault();
    }
  };
}
function create_else_block$3(ctx) {
  let input;
  let mounted;
  let dispose;
  return {
    c() {
      input = element("input");
      attr(input, "type", "text");
    },
    m(target, anchor) {
      insert(target, input, anchor);
      set_input_value(input, ctx[2]);
      if (!mounted) {
        dispose = [
          listen(input, "input", ctx[7]),
          action_destroyer(takeFocus$1.call(null, input)),
          listen(input, "keydown", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && input.value !== ctx2[2]) {
        set_input_value(input, ctx2[2]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(input);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block$5(ctx) {
  let span;
  let t0;
  let t1;
  let mounted;
  let dispose;
  let if_block = ctx[1] == "" && create_if_block_1$3();
  return {
    c() {
      span = element("span");
      if (if_block)
        if_block.c();
      t0 = space();
      t1 = text(ctx[1]);
      attr(span, "role", "button");
      attr(span, "tabindex", "0");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      if (if_block)
        if_block.m(span, null);
      append(span, t0);
      append(span, t1);
      ctx[6](span);
      if (!mounted) {
        dispose = [
          listen(span, "click", ctx[4]),
          listen(span, "keydown", ifClickEquivalent(ctx[4]))
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (ctx2[1] == "") {
        if (if_block)
          ;
        else {
          if_block = create_if_block_1$3();
          if_block.c();
          if_block.m(span, t0);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & 2)
        set_data(t1, ctx2[1]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block)
        if_block.d();
      ctx[6](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1$3(ctx) {
  let t;
  return {
    c() {
      t = text("\xA0");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_fragment$6(ctx) {
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (ctx2[0] === EditMode$1.Read)
      return create_if_block$5;
    return create_else_block$3;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
var EditMode$1;
(function(EditMode2) {
  EditMode2[EditMode2["Read"] = 0] = "Read";
  EditMode2[EditMode2["Edit"] = 1] = "Edit";
})(EditMode$1 || (EditMode$1 = {}));
function takeFocus$1(el) {
  el.focus();
  el.select();
}
function instance$6($$self, $$props, $$invalidate) {
  const dispatch2 = createEventDispatcher();
  let { value = "" } = $$props;
  let newValue = value;
  let focusTarget;
  let { mode = EditMode$1.Read } = $$props;
  function startEditing() {
    $$invalidate(0, mode = EditMode$1.Edit);
  }
  function onKeyDown(e) {
    if (e.key === "Enter") {
      $$invalidate(1, value = $$invalidate(2, newValue = newValue.trim()));
      $$invalidate(0, mode = EditMode$1.Read);
      dispatch2("confirmed", { value });
    } else if (e.key === "Escape") {
      $$invalidate(2, newValue = value);
      $$invalidate(0, mode = EditMode$1.Read);
      dispatch2("cancelled", { value });
    }
    tick().then(() => focusTarget === null || focusTarget === void 0 ? void 0 : focusTarget.focus());
  }
  function span_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      focusTarget = $$value;
      $$invalidate(3, focusTarget);
    });
  }
  function input_input_handler() {
    newValue = this.value;
    $$invalidate(2, newValue);
  }
  $$self.$$set = ($$props2) => {
    if ("value" in $$props2)
      $$invalidate(1, value = $$props2.value);
    if ("mode" in $$props2)
      $$invalidate(0, mode = $$props2.mode);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1) {
      dispatch2("modeChanged", { mode });
    }
  };
  return [
    mode,
    value,
    newValue,
    focusTarget,
    startEditing,
    onKeyDown,
    span_binding,
    input_input_handler
  ];
}
class EditableText extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$6, create_fragment$6, safe_not_equal, { value: 1, mode: 0 });
  }
}
function create_else_block$2(ctx) {
  let input;
  let mounted;
  let dispose;
  return {
    c() {
      input = element("input");
      attr(input, "type", "text");
    },
    m(target, anchor) {
      insert(target, input, anchor);
      set_input_value(input, ctx[2]);
      if (!mounted) {
        dispose = [
          listen(input, "input", ctx[8]),
          action_destroyer(takeFocus.call(null, input)),
          listen(input, "keydown", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && input.value !== ctx2[2]) {
        set_input_value(input, ctx2[2]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(input);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block$4(ctx) {
  let span;
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      span = element("span");
      t = text(ctx[1]);
      attr(span, "role", "button");
      attr(span, "tabindex", "0");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
      ctx[7](span);
      if (!mounted) {
        dispose = [
          listen(span, "click", prevent_default(ctx[4])),
          listen(span, "keydown", ctx[6])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 2)
        set_data(t, ctx2[1]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
      ctx[7](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$5(ctx) {
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (ctx2[0] === EditMode.Read)
      return create_if_block$4;
    return create_else_block$2;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
var EditMode;
(function(EditMode2) {
  EditMode2[EditMode2["Read"] = 0] = "Read";
  EditMode2[EditMode2["Edit"] = 1] = "Edit";
})(EditMode || (EditMode = {}));
function takeFocus(el) {
  el.focus();
  el.select();
}
function instance$5($$self, $$props, $$invalidate) {
  const dispatch2 = createEventDispatcher();
  let { value = 0 } = $$props;
  let newValue = value.toString();
  let focusTarget;
  let { mode = EditMode.Read } = $$props;
  function startEditing() {
    if (!newValue.startsWith("+") && !newValue.startsWith("-")) {
      $$invalidate(2, newValue = value.toString());
    }
    $$invalidate(0, mode = EditMode.Edit);
  }
  function onEditKeyDown(e) {
    if (e.key === "Enter") {
      $$invalidate(2, newValue = newValue.trim());
      if (newValue.startsWith("+") || newValue.startsWith("-")) {
        $$invalidate(1, value += Number(newValue));
      } else {
        $$invalidate(1, value = Number(newValue));
      }
      $$invalidate(0, mode = EditMode.Read);
      dispatch2("confirmed", { value });
    } else if (e.key === "Escape") {
      $$invalidate(0, mode = EditMode.Read);
      dispatch2("cancelled", { value });
    }
    tick().then(() => focusTarget === null || focusTarget === void 0 ? void 0 : focusTarget.focus());
  }
  function onSpanKeyDown(e) {
    if (["Enter", " "].contains(e.key)) {
      startEditing();
      e.preventDefault();
    } else if (["ArrowUp", "ArrowRight"].contains(e.key)) {
      $$invalidate(1, value += 1);
      e.preventDefault();
    } else if (["ArrowDown", "ArrowLeft"].contains(e.key)) {
      $$invalidate(1, value -= 1);
      e.preventDefault();
    }
  }
  function span_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      focusTarget = $$value;
      $$invalidate(3, focusTarget);
    });
  }
  function input_input_handler() {
    newValue = this.value;
    $$invalidate(2, newValue);
  }
  $$self.$$set = ($$props2) => {
    if ("value" in $$props2)
      $$invalidate(1, value = $$props2.value);
    if ("mode" in $$props2)
      $$invalidate(0, mode = $$props2.mode);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1) {
      dispatch2("modeChanged", { mode });
    }
  };
  return [
    mode,
    value,
    newValue,
    focusTarget,
    startEditing,
    onEditKeyDown,
    onSpanKeyDown,
    span_binding,
    input_input_handler
  ];
}
class EditableNumber extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$5, create_fragment$5, safe_not_equal, { value: 1, mode: 0 });
  }
}
function get_each_context$3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[12] = list[i].x1;
  child_ctx[13] = list[i].x2;
  child_ctx[14] = list[i].y1;
  child_ctx[15] = list[i].y2;
  child_ctx[16] = list[i].isFilled;
  child_ctx[18] = i;
  return child_ctx;
}
function create_if_block$3(ctx) {
  let each_1_anchor;
  let each_value = ctx[3](ctx[0], ctx[1]);
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
  }
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 11) {
        each_value = ctx2[3](ctx2[0], ctx2[1]);
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$3(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$3(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(each_1_anchor);
    }
  };
}
function create_each_block$3(ctx) {
  let path;
  let path_data_filled_value;
  let path_d_value;
  return {
    c() {
      path = svg_element("path");
      attr(path, "data-segment", ctx[18]);
      attr(path, "data-filled", path_data_filled_value = ctx[16]);
      attr(path, "d", path_d_value = "\n        M " + (radius + padding) + " " + (radius + padding) + "\n        L " + ctx[12] + " " + ctx[14] + "\n        A " + radius + " " + radius + " 0 0 1 " + ctx[13] + " " + ctx[15] + "\n        Z");
    },
    m(target, anchor) {
      insert(target, path, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 3 && path_data_filled_value !== (path_data_filled_value = ctx2[16])) {
        attr(path, "data-filled", path_data_filled_value);
      }
      if (dirty & 3 && path_d_value !== (path_d_value = "\n        M " + (radius + padding) + " " + (radius + padding) + "\n        L " + ctx2[12] + " " + ctx2[14] + "\n        A " + radius + " " + radius + " 0 0 1 " + ctx2[13] + " " + ctx2[15] + "\n        Z")) {
        attr(path, "d", path_d_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(path);
    }
  };
}
function create_fragment$4(ctx) {
  let div1;
  let svg;
  let circle;
  let t0;
  let div0;
  let button0;
  let minussquare;
  let t1;
  let button1;
  let plussquare;
  let t2;
  let button2;
  let arrowdownfromline;
  let t3;
  let button3;
  let arrowupfromline;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[0] > 1 && create_if_block$3(ctx);
  minussquare = new MinusSquare({});
  plussquare = new PlusSquare({});
  arrowdownfromline = new ArrowDownFromLine({});
  arrowupfromline = new ArrowUpFromLine({});
  return {
    c() {
      div1 = element("div");
      svg = svg_element("svg");
      if (if_block)
        if_block.c();
      circle = svg_element("circle");
      t0 = space();
      div0 = element("div");
      button0 = element("button");
      create_component(minussquare.$$.fragment);
      t1 = space();
      button1 = element("button");
      create_component(plussquare.$$.fragment);
      t2 = space();
      button2 = element("button");
      create_component(arrowdownfromline.$$.fragment);
      t3 = space();
      button3 = element("button");
      create_component(arrowupfromline.$$.fragment);
      attr(circle, "cx", radius + padding);
      attr(circle, "cy", radius + padding);
      attr(circle, "r", radius);
      attr(circle, "data-filled", ctx[2]);
      attr(svg, "data-segments", ctx[0]);
      attr(svg, "data-filled", ctx[1]);
      attr(svg, "role", "button");
      attr(svg, "tabindex", "0");
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "viewBox", "0 0 " + (2 * radius + 2 * padding) + " " + (2 * radius + 2 * padding));
      attr(button0, "class", "progress-clocks-clock__decrement");
      attr(button0, "title", "Unfill one segment");
      attr(button1, "class", "progress-clocks-clock__increment");
      attr(button1, "title", "Fill one segment");
      attr(button2, "class", "progress-clocks-clock__decrement-segments");
      attr(button2, "title", "Remove one segment");
      attr(button3, "class", "progress-clocks-clock__increment-segments");
      attr(button3, "title", "Add another segment");
      attr(div0, "class", "progress-clocks-clock__buttons");
      attr(div1, "class", "progress-clocks-clock");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, svg);
      if (if_block)
        if_block.m(svg, null);
      append(svg, circle);
      append(div1, t0);
      append(div1, div0);
      append(div0, button0);
      mount_component(minussquare, button0, null);
      append(div0, t1);
      append(div0, button1);
      mount_component(plussquare, button1, null);
      append(div0, t2);
      append(div0, button2);
      mount_component(arrowdownfromline, button2, null);
      append(div0, t3);
      append(div0, button3);
      mount_component(arrowupfromline, button3, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(svg, "click", prevent_default(ctx[4])),
          listen(svg, "contextmenu", prevent_default(ctx[5])),
          listen(svg, "keydown", ctx[6]),
          listen(button0, "click", prevent_default(ctx[5])),
          listen(button0, "keydown", ifClickEquivalent(ctx[5])),
          listen(button1, "click", prevent_default(ctx[4])),
          listen(button1, "keydown", ifClickEquivalent(ctx[4])),
          listen(button2, "click", prevent_default(ctx[7])),
          listen(button2, "keydown", function() {
            if (is_function(ifClickEquivalent(ctx[8])))
              ifClickEquivalent(ctx[8]).apply(this, arguments);
          }),
          listen(button3, "click", prevent_default(ctx[9])),
          listen(button3, "keydown", function() {
            if (is_function(ifClickEquivalent(ctx[10])))
              ifClickEquivalent(ctx[10]).apply(this, arguments);
          })
        ];
        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      if (ctx[0] > 1) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block$3(ctx);
          if_block.c();
          if_block.m(svg, circle);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (!current || dirty & 4) {
        attr(circle, "data-filled", ctx[2]);
      }
      if (!current || dirty & 1) {
        attr(svg, "data-segments", ctx[0]);
      }
      if (!current || dirty & 2) {
        attr(svg, "data-filled", ctx[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(minussquare.$$.fragment, local);
      transition_in(plussquare.$$.fragment, local);
      transition_in(arrowdownfromline.$$.fragment, local);
      transition_in(arrowupfromline.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(minussquare.$$.fragment, local);
      transition_out(plussquare.$$.fragment, local);
      transition_out(arrowdownfromline.$$.fragment, local);
      transition_out(arrowupfromline.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block)
        if_block.d();
      destroy_component(minussquare);
      destroy_component(plussquare);
      destroy_component(arrowdownfromline);
      destroy_component(arrowupfromline);
      mounted = false;
      run_all(dispose);
    }
  };
}
const radius = 50;
const padding = 4;
function instance$4($$self, $$props, $$invalidate) {
  let fillCircle;
  let { segments = 4 } = $$props;
  let { filled = 0 } = $$props;
  const dispatch2 = createEventDispatcher();
  function slices(segments2, filled2) {
    const ss = [];
    for (let i = 0; i < segments2; ++i) {
      const x1 = radius * Math.sin(2 * Math.PI * i / segments2) + radius + padding;
      const x2 = radius * Math.sin(2 * Math.PI * (i + 1) / segments2) + radius + padding;
      const y1 = -radius * Math.cos(2 * Math.PI * i / segments2) + radius + padding;
      const y2 = -radius * Math.cos(2 * Math.PI * (i + 1) / segments2) + radius + padding;
      ss.push({ x1, x2, y1, y2, isFilled: i < filled2 });
    }
    return ss;
  }
  function handleIncrement(e) {
    if (e.ctrlKey || e.metaKey) {
      $$invalidate(0, segments += 1);
    } else {
      $$invalidate(1, filled += 1);
    }
  }
  function handleDecrement(e) {
    if (e.ctrlKey || e.metaKey) {
      $$invalidate(0, segments -= 1);
      $$invalidate(1, filled = Math.min(segments, filled));
    } else {
      $$invalidate(1, filled -= 1);
    }
  }
  function handleClockKeyInteraction(e) {
    if (["Enter", " ", "ArrowUp", "ArrowRight"].contains(e.key)) {
      if (e.ctrlKey || e.metaKey) {
        $$invalidate(0, segments += 1);
      } else {
        $$invalidate(1, filled += 1);
      }
      e.preventDefault();
    } else if (["ArrowDown", "ArrowLeft"].contains(e.key)) {
      if (e.ctrlKey || e.metaKey) {
        $$invalidate(0, segments -= 1);
        $$invalidate(1, filled = Math.min(segments, filled));
      } else {
        $$invalidate(1, filled -= 1);
      }
      e.preventDefault();
    }
  }
  const click_handler = () => $$invalidate(0, segments -= 1);
  const keydown_handler = () => $$invalidate(0, segments -= 1);
  const click_handler_1 = () => $$invalidate(0, segments += 1);
  const keydown_handler_1 = () => $$invalidate(0, segments += 1);
  $$self.$$set = ($$props2) => {
    if ("segments" in $$props2)
      $$invalidate(0, segments = $$props2.segments);
    if ("filled" in $$props2)
      $$invalidate(1, filled = $$props2.filled);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1) {
      $$invalidate(0, segments = Math.max(1, segments));
    }
    if ($$self.$$.dirty & 3) {
      $$invalidate(1, filled = filled < 0 ? segments : filled);
    }
    if ($$self.$$.dirty & 3) {
      $$invalidate(1, filled = filled > segments ? 0 : filled);
    }
    if ($$self.$$.dirty & 3) {
      dispatch2("updated", { segments, filled });
    }
    if ($$self.$$.dirty & 3) {
      $$invalidate(2, fillCircle = segments <= 1 ? filled >= 1 : null);
    }
  };
  return [
    segments,
    filled,
    fillCircle,
    slices,
    handleIncrement,
    handleDecrement,
    handleClockKeyInteraction,
    click_handler,
    keydown_handler,
    click_handler_1,
    keydown_handler_1
  ];
}
class Clock extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$4, create_fragment$4, safe_not_equal, { segments: 0, filled: 1 });
  }
}
function create_fragment$3(ctx) {
  let div4;
  let div0;
  let editablenumber;
  let updating_value;
  let t0;
  let div3;
  let div1;
  let minussquare;
  let t1;
  let div2;
  let plussquare;
  let current;
  let mounted;
  let dispose;
  function editablenumber_value_binding(value) {
    ctx[3](value);
  }
  let editablenumber_props = {};
  if (ctx[0] !== void 0) {
    editablenumber_props.value = ctx[0];
  }
  editablenumber = new EditableNumber({ props: editablenumber_props });
  binding_callbacks.push(() => bind(editablenumber, "value", editablenumber_value_binding));
  minussquare = new MinusSquare({});
  plussquare = new PlusSquare({});
  return {
    c() {
      div4 = element("div");
      div0 = element("div");
      create_component(editablenumber.$$.fragment);
      t0 = space();
      div3 = element("div");
      div1 = element("div");
      create_component(minussquare.$$.fragment);
      t1 = space();
      div2 = element("div");
      create_component(plussquare.$$.fragment);
      attr(div0, "class", "progress-clocks-counter__value");
      attr(div1, "role", "button");
      attr(div1, "tabindex", "0");
      attr(div1, "class", "progress-clocks-button progress-clocks-counter__decrement");
      attr(div2, "role", "button");
      attr(div2, "tabindex", "0");
      attr(div2, "class", "progress-clocks-button progress-clocks-counter__increment");
      attr(div3, "class", "progress-clocks-counter__buttons");
      attr(div4, "class", "progress-clocks-counter");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div0);
      mount_component(editablenumber, div0, null);
      append(div4, t0);
      append(div4, div3);
      append(div3, div1);
      mount_component(minussquare, div1, null);
      append(div3, t1);
      append(div3, div2);
      mount_component(plussquare, div2, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(div1, "click", prevent_default(ctx[2])),
          listen(div1, "keydown", ifClickEquivalent(ctx[2])),
          listen(div2, "click", prevent_default(ctx[1])),
          listen(div2, "keydown", ifClickEquivalent(ctx[1]))
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      const editablenumber_changes = {};
      if (!updating_value && dirty & 1) {
        updating_value = true;
        editablenumber_changes.value = ctx2[0];
        add_flush_callback(() => updating_value = false);
      }
      editablenumber.$set(editablenumber_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(editablenumber.$$.fragment, local);
      transition_in(minussquare.$$.fragment, local);
      transition_in(plussquare.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(editablenumber.$$.fragment, local);
      transition_out(minussquare.$$.fragment, local);
      transition_out(plussquare.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div4);
      destroy_component(editablenumber);
      destroy_component(minussquare);
      destroy_component(plussquare);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$3($$self, $$props, $$invalidate) {
  let { value = 0 } = $$props;
  const dispatch2 = createEventDispatcher();
  function increment() {
    $$invalidate(0, value += 1);
  }
  function decrement() {
    $$invalidate(0, value -= 1);
  }
  function editablenumber_value_binding(value$1) {
    value = value$1;
    $$invalidate(0, value);
  }
  $$self.$$set = ($$props2) => {
    if ("value" in $$props2)
      $$invalidate(0, value = $$props2.value);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1) {
      dispatch2("updated", { value });
    }
  };
  return [value, increment, decrement, editablenumber_value_binding];
}
class Counter extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 0, increment: 1, decrement: 2 });
  }
  get increment() {
    return this.$$.ctx[1];
  }
  get decrement() {
    return this.$$.ctx[2];
  }
}
function get_each_context$2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[18] = list[i];
  child_ctx[20] = i;
  return child_ctx;
}
function create_else_block$1(ctx) {
  let play;
  let current;
  play = new Play$1({});
  return {
    c() {
      create_component(play.$$.fragment);
    },
    m(target, anchor) {
      mount_component(play, target, anchor);
      current = true;
    },
    i(local) {
      if (current)
        return;
      transition_in(play.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(play.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(play, detaching);
    }
  };
}
function create_if_block_1$2(ctx) {
  let pause;
  let current;
  pause = new Pause$1({});
  return {
    c() {
      create_component(pause.$$.fragment);
    },
    m(target, anchor) {
      mount_component(pause, target, anchor);
      current = true;
    },
    i(local) {
      if (current)
        return;
      transition_in(pause.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(pause.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(pause, detaching);
    }
  };
}
function create_if_block$2(ctx) {
  let div;
  let each_value = ctx[2];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "progress-clocks-stopwatch__laps");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty & 517) {
        each_value = ctx2[2];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$2(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block$2(ctx) {
  let div;
  let t0;
  let t1_value = ctx[20] + 1 + "";
  let t1;
  let t2;
  let t3_value = ctx[9](ctx[18], ctx[0]) + "";
  let t3;
  let div_data_lap_time_ms_value;
  return {
    c() {
      div = element("div");
      t0 = text("(");
      t1 = text(t1_value);
      t2 = text(") ");
      t3 = text(t3_value);
      attr(div, "data-lap-time-ms", div_data_lap_time_ms_value = ctx[18]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
      append(div, t3);
    },
    p(ctx2, dirty) {
      if (dirty & 5 && t3_value !== (t3_value = ctx2[9](ctx2[18], ctx2[0]) + ""))
        set_data(t3, t3_value);
      if (dirty & 4 && div_data_lap_time_ms_value !== (div_data_lap_time_ms_value = ctx2[18])) {
        attr(div, "data-lap-time-ms", div_data_lap_time_ms_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment$2(ctx) {
  let div2;
  let div0;
  let t0_value = ctx[9](ctx[8], ctx[0]) + "";
  let t0;
  let t1;
  let div1;
  let button0;
  let current_block_type_index;
  let if_block0;
  let t2;
  let button1;
  let refreshccw;
  let t3;
  let button2;
  let timer;
  let t4;
  let button3;
  let t6;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block_1$2, create_else_block$1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[1])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  refreshccw = new RefreshCcw({});
  timer = new Timer$1({});
  let if_block1 = ctx[2].length > 0 && create_if_block$2(ctx);
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      t0 = text(t0_value);
      t1 = space();
      div1 = element("div");
      button0 = element("button");
      if_block0.c();
      t2 = space();
      button1 = element("button");
      create_component(refreshccw.$$.fragment);
      t3 = space();
      button2 = element("button");
      create_component(timer.$$.fragment);
      t4 = space();
      button3 = element("button");
      button3.textContent = "/1000";
      t6 = space();
      if (if_block1)
        if_block1.c();
      attr(div0, "class", "progress-clocks-stopwatch__elapsed");
      attr(div0, "role", "button");
      attr(div0, "tabindex", "0");
      attr(div1, "class", "progress-clocks-stopwatch__buttons");
      attr(div2, "class", "progress-clocks-stopwatch");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div0, t0);
      append(div2, t1);
      append(div2, div1);
      append(div1, button0);
      if_blocks[current_block_type_index].m(button0, null);
      append(div1, t2);
      append(div1, button1);
      mount_component(refreshccw, button1, null);
      append(div1, t3);
      append(div1, button2);
      mount_component(timer, button2, null);
      append(div1, t4);
      append(div1, button3);
      append(div2, t6);
      if (if_block1)
        if_block1.m(div2, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(div0, "click", ctx[6]),
          listen(div0, "keydown", ifClickEquivalent(ctx[6])),
          listen(button0, "click", ctx[12]),
          listen(button1, "click", ctx[5]),
          listen(button2, "click", ctx[7]),
          listen(button3, "click", ctx[13])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if ((!current || dirty & 257) && t0_value !== (t0_value = ctx2[9](ctx2[8], ctx2[0]) + ""))
        set_data(t0, t0_value);
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index !== previous_block_index) {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block0 = if_blocks[current_block_type_index];
        if (!if_block0) {
          if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block0.c();
        }
        transition_in(if_block0, 1);
        if_block0.m(button0, null);
      }
      if (ctx2[2].length > 0) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block$2(ctx2);
          if_block1.c();
          if_block1.m(div2, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block0);
      transition_in(refreshccw.$$.fragment, local);
      transition_in(timer.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(refreshccw.$$.fragment, local);
      transition_out(timer.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      if_blocks[current_block_type_index].d();
      destroy_component(refreshccw);
      destroy_component(timer);
      if (if_block1)
        if_block1.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
const TICK_INTERVAL_MS = 10;
function instance$2($$self, $$props, $$invalidate) {
  const dispatch2 = createEventDispatcher();
  const locale = Intl.NumberFormat().resolvedOptions().locale;
  let { startMillis = new Date().getTime() } = $$props;
  let { offsetMillis = 0 } = $$props;
  let { showMillis = false } = $$props;
  let { isRunning = true } = $$props;
  let { lapTimes = [] } = $$props;
  let elapsedMs = 0;
  let tickInterval = null;
  function tick2() {
    $$invalidate(8, elapsedMs = new Date().getTime() - startMillis + offsetMillis);
  }
  onMount(() => {
    if (isRunning) {
      tick2();
      start();
    } else {
      $$invalidate(8, elapsedMs = offsetMillis);
    }
  });
  onDestroy(() => {
    if (tickInterval) {
      window.clearInterval(tickInterval);
      tickInterval = null;
    }
  });
  function start() {
    if (tickInterval) {
      window.clearInterval(tickInterval);
      tickInterval = null;
    }
    $$invalidate(11, offsetMillis = elapsedMs);
    $$invalidate(10, startMillis = new Date().getTime());
    tickInterval = window.setInterval(tick2, TICK_INTERVAL_MS);
    $$invalidate(1, isRunning = true);
  }
  function stop() {
    if (tickInterval) {
      window.clearInterval(tickInterval);
      tickInterval = null;
    }
    $$invalidate(11, offsetMillis = elapsedMs);
    $$invalidate(1, isRunning = false);
  }
  function reset() {
    $$invalidate(10, startMillis = new Date().getTime());
    $$invalidate(11, offsetMillis = 0);
    $$invalidate(2, lapTimes = []);
    $$invalidate(8, elapsedMs = 0);
  }
  function togglePrecision() {
    $$invalidate(0, showMillis = !showMillis);
  }
  function lap() {
    lapTimes.push(elapsedMs);
    $$invalidate(2, lapTimes);
    dispatch2("lap", { elapsedMs });
  }
  function formatTime(ms, showMillis2 = false) {
    const seconds = showMillis2 ? ms / 1e3 % 60 : Math.floor(ms / 1e3) % 60;
    const secondsFormatted = Intl.NumberFormat(locale, {
      style: "decimal",
      minimumIntegerDigits: 2,
      minimumFractionDigits: showMillis2 ? 3 : 0
    }).format(seconds);
    const minutes = Math.floor(ms / 1e3 / 60) % 60;
    const minutesFormatted = Intl.NumberFormat(locale, {
      style: "decimal",
      minimumIntegerDigits: 2
    }).format(minutes);
    const hours = Math.floor(ms / 1e3 / 60 / 60);
    const hoursFormatted = Intl.NumberFormat(locale, {
      style: "decimal",
      minimumIntegerDigits: 2
    }).format(hours);
    return hours > 0 ? `${hoursFormatted}:${minutesFormatted}:${secondsFormatted}` : `${minutesFormatted}:${secondsFormatted}`;
  }
  const click_handler = () => isRunning ? stop() : start();
  const click_handler_1 = () => $$invalidate(0, showMillis = !showMillis);
  $$self.$$set = ($$props2) => {
    if ("startMillis" in $$props2)
      $$invalidate(10, startMillis = $$props2.startMillis);
    if ("offsetMillis" in $$props2)
      $$invalidate(11, offsetMillis = $$props2.offsetMillis);
    if ("showMillis" in $$props2)
      $$invalidate(0, showMillis = $$props2.showMillis);
    if ("isRunning" in $$props2)
      $$invalidate(1, isRunning = $$props2.isRunning);
    if ("lapTimes" in $$props2)
      $$invalidate(2, lapTimes = $$props2.lapTimes);
  };
  return [
    showMillis,
    isRunning,
    lapTimes,
    start,
    stop,
    reset,
    togglePrecision,
    lap,
    elapsedMs,
    formatTime,
    startMillis,
    offsetMillis,
    click_handler,
    click_handler_1
  ];
}
class StopWatch extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      startMillis: 10,
      offsetMillis: 11,
      showMillis: 0,
      isRunning: 1,
      lapTimes: 2,
      start: 3,
      stop: 4,
      reset: 5,
      togglePrecision: 6,
      lap: 7
    });
  }
  get start() {
    return this.$$.ctx[3];
  }
  get stop() {
    return this.$$.ctx[4];
  }
  get reset() {
    return this.$$.ctx[5];
  }
  get togglePrecision() {
    return this.$$.ctx[6];
  }
  get lap() {
    return this.$$.ctx[7];
  }
}
function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[27] = list[i];
  child_ctx[28] = list;
  child_ctx[29] = i;
  return child_ctx;
}
function create_if_block_3(ctx) {
  let stopwatch;
  let updating_startMillis;
  let updating_offsetMillis;
  let updating_showMillis;
  let updating_isRunning;
  let updating_lapTimes;
  let current;
  const stopwatch_spread_levels = [ctx[27]];
  function stopwatch_startMillis_binding(value) {
    ctx[14](value, ctx[27]);
  }
  function stopwatch_offsetMillis_binding(value) {
    ctx[15](value, ctx[27]);
  }
  function stopwatch_showMillis_binding(value) {
    ctx[16](value, ctx[27]);
  }
  function stopwatch_isRunning_binding(value) {
    ctx[17](value, ctx[27]);
  }
  function stopwatch_lapTimes_binding(value) {
    ctx[18](value, ctx[27]);
  }
  let stopwatch_props = {};
  for (let i = 0; i < stopwatch_spread_levels.length; i += 1) {
    stopwatch_props = assign(stopwatch_props, stopwatch_spread_levels[i]);
  }
  if (ctx[27].startMillis !== void 0) {
    stopwatch_props.startMillis = ctx[27].startMillis;
  }
  if (ctx[27].offsetMillis !== void 0) {
    stopwatch_props.offsetMillis = ctx[27].offsetMillis;
  }
  if (ctx[27].showMillis !== void 0) {
    stopwatch_props.showMillis = ctx[27].showMillis;
  }
  if (ctx[27].isRunning !== void 0) {
    stopwatch_props.isRunning = ctx[27].isRunning;
  }
  if (ctx[27].lapTimes !== void 0) {
    stopwatch_props.lapTimes = ctx[27].lapTimes;
  }
  stopwatch = new StopWatch({ props: stopwatch_props });
  binding_callbacks.push(() => bind(stopwatch, "startMillis", stopwatch_startMillis_binding));
  binding_callbacks.push(() => bind(stopwatch, "offsetMillis", stopwatch_offsetMillis_binding));
  binding_callbacks.push(() => bind(stopwatch, "showMillis", stopwatch_showMillis_binding));
  binding_callbacks.push(() => bind(stopwatch, "isRunning", stopwatch_isRunning_binding));
  binding_callbacks.push(() => bind(stopwatch, "lapTimes", stopwatch_lapTimes_binding));
  return {
    c() {
      create_component(stopwatch.$$.fragment);
    },
    m(target, anchor) {
      mount_component(stopwatch, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const stopwatch_changes = dirty & 2 ? get_spread_update(stopwatch_spread_levels, [get_spread_object(ctx[27])]) : {};
      if (!updating_startMillis && dirty & 2) {
        updating_startMillis = true;
        stopwatch_changes.startMillis = ctx[27].startMillis;
        add_flush_callback(() => updating_startMillis = false);
      }
      if (!updating_offsetMillis && dirty & 2) {
        updating_offsetMillis = true;
        stopwatch_changes.offsetMillis = ctx[27].offsetMillis;
        add_flush_callback(() => updating_offsetMillis = false);
      }
      if (!updating_showMillis && dirty & 2) {
        updating_showMillis = true;
        stopwatch_changes.showMillis = ctx[27].showMillis;
        add_flush_callback(() => updating_showMillis = false);
      }
      if (!updating_isRunning && dirty & 2) {
        updating_isRunning = true;
        stopwatch_changes.isRunning = ctx[27].isRunning;
        add_flush_callback(() => updating_isRunning = false);
      }
      if (!updating_lapTimes && dirty & 2) {
        updating_lapTimes = true;
        stopwatch_changes.lapTimes = ctx[27].lapTimes;
        add_flush_callback(() => updating_lapTimes = false);
      }
      stopwatch.$set(stopwatch_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(stopwatch.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(stopwatch.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(stopwatch, detaching);
    }
  };
}
function create_if_block_2$1(ctx) {
  let counter;
  let updating_value;
  let current;
  const counter_spread_levels = [ctx[27]];
  function counter_value_binding(value) {
    ctx[13](value, ctx[27]);
  }
  let counter_props = {};
  for (let i = 0; i < counter_spread_levels.length; i += 1) {
    counter_props = assign(counter_props, counter_spread_levels[i]);
  }
  if (ctx[27].value !== void 0) {
    counter_props.value = ctx[27].value;
  }
  counter = new Counter({ props: counter_props });
  binding_callbacks.push(() => bind(counter, "value", counter_value_binding));
  return {
    c() {
      create_component(counter.$$.fragment);
    },
    m(target, anchor) {
      mount_component(counter, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const counter_changes = dirty & 2 ? get_spread_update(counter_spread_levels, [get_spread_object(ctx[27])]) : {};
      if (!updating_value && dirty & 2) {
        updating_value = true;
        counter_changes.value = ctx[27].value;
        add_flush_callback(() => updating_value = false);
      }
      counter.$set(counter_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(counter.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(counter.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(counter, detaching);
    }
  };
}
function create_if_block_1$1(ctx) {
  let clock;
  let updating_segments;
  let updating_filled;
  let current;
  const clock_spread_levels = [ctx[27]];
  function clock_segments_binding(value) {
    ctx[11](value, ctx[27]);
  }
  function clock_filled_binding(value) {
    ctx[12](value, ctx[27]);
  }
  let clock_props = {};
  for (let i = 0; i < clock_spread_levels.length; i += 1) {
    clock_props = assign(clock_props, clock_spread_levels[i]);
  }
  if (ctx[27].segments !== void 0) {
    clock_props.segments = ctx[27].segments;
  }
  if (ctx[27].filled !== void 0) {
    clock_props.filled = ctx[27].filled;
  }
  clock = new Clock({ props: clock_props });
  binding_callbacks.push(() => bind(clock, "segments", clock_segments_binding));
  binding_callbacks.push(() => bind(clock, "filled", clock_filled_binding));
  return {
    c() {
      create_component(clock.$$.fragment);
    },
    m(target, anchor) {
      mount_component(clock, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const clock_changes = dirty & 2 ? get_spread_update(clock_spread_levels, [get_spread_object(ctx[27])]) : {};
      if (!updating_segments && dirty & 2) {
        updating_segments = true;
        clock_changes.segments = ctx[27].segments;
        add_flush_callback(() => updating_segments = false);
      }
      if (!updating_filled && dirty & 2) {
        updating_filled = true;
        clock_changes.filled = ctx[27].filled;
        add_flush_callback(() => updating_filled = false);
      }
      clock.$set(clock_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(clock.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(clock.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(clock, detaching);
    }
  };
}
function create_each_block$1(ctx) {
  let div3;
  let current_block_type_index;
  let if_block;
  let t0;
  let div0;
  let editabletext;
  let updating_value;
  let t1;
  let div2;
  let div1;
  let trash2;
  let t2;
  let div3_data_child_type_value;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block_1$1, create_if_block_2$1, create_if_block_3];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[27].type === "clock")
      return 0;
    if (ctx2[27].type === "counter")
      return 1;
    if (ctx2[27].type === "stopwatch")
      return 2;
    return -1;
  }
  if (~(current_block_type_index = select_block_type(ctx))) {
    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  }
  function editabletext_value_binding_1(value) {
    ctx[19](value, ctx[27]);
  }
  let editabletext_props = {};
  if (ctx[27].name !== void 0) {
    editabletext_props.value = ctx[27].name;
  }
  editabletext = new EditableText({ props: editabletext_props });
  binding_callbacks.push(() => bind(editabletext, "value", editabletext_value_binding_1));
  trash2 = new Trash2({});
  function click_handler() {
    return ctx[20](ctx[29]);
  }
  function keydown_handler() {
    return ctx[21](ctx[29]);
  }
  return {
    c() {
      div3 = element("div");
      if (if_block)
        if_block.c();
      t0 = space();
      div0 = element("div");
      create_component(editabletext.$$.fragment);
      t1 = space();
      div2 = element("div");
      div1 = element("div");
      create_component(trash2.$$.fragment);
      t2 = space();
      attr(div0, "class", "progress-clocks-section__child-name");
      attr(div1, "role", "button");
      attr(div1, "tabindex", "0");
      attr(div1, "class", "progress-clocks-button progress-clocks-section__remove-child");
      attr(div2, "class", "progress-clocks-section__remove-child");
      attr(div3, "class", "progress-clocks-section__child");
      attr(div3, "data-child-type", div3_data_child_type_value = ctx[27].type);
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(div3, null);
      }
      append(div3, t0);
      append(div3, div0);
      mount_component(editabletext, div0, null);
      append(div3, t1);
      append(div3, div2);
      append(div2, div1);
      mount_component(trash2, div1, null);
      append(div3, t2);
      current = true;
      if (!mounted) {
        dispose = [
          listen(div1, "click", click_handler),
          listen(div1, "keydown", ifClickEquivalent(keydown_handler))
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);
      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx, dirty);
        }
      } else {
        if (if_block) {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
        }
        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];
          if (!if_block) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
            if_block.c();
          } else {
            if_block.p(ctx, dirty);
          }
          transition_in(if_block, 1);
          if_block.m(div3, t0);
        } else {
          if_block = null;
        }
      }
      const editabletext_changes = {};
      if (!updating_value && dirty & 2) {
        updating_value = true;
        editabletext_changes.value = ctx[27].name;
        add_flush_callback(() => updating_value = false);
      }
      editabletext.$set(editabletext_changes);
      if (!current || dirty & 2 && div3_data_child_type_value !== (div3_data_child_type_value = ctx[27].type)) {
        attr(div3, "data-child-type", div3_data_child_type_value);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      transition_in(editabletext.$$.fragment, local);
      transition_in(trash2.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(editabletext.$$.fragment, local);
      transition_out(trash2.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div3);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d();
      }
      destroy_component(editabletext);
      destroy_component(trash2);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_else_block(ctx) {
  let button;
  let piechart;
  let current;
  let mounted;
  let dispose;
  piechart = new PieChart({});
  return {
    c() {
      button = element("button");
      create_component(piechart.$$.fragment);
      attr(button, "class", "progress-clocks-section__add-clock");
      attr(button, "title", "Add new progress clock");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      mount_component(piechart, button, null);
      current = true;
      if (!mounted) {
        dispose = listen(button, "click", ctx[25]);
        mounted = true;
      }
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(piechart.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(piechart.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(button);
      destroy_component(piechart);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block$1(ctx) {
  let editablenumber;
  let updating_mode;
  let updating_value;
  let current;
  function editablenumber_mode_binding(value) {
    ctx[22](value);
  }
  function editablenumber_value_binding(value) {
    ctx[23](value);
  }
  let editablenumber_props = {};
  if (ctx[3] !== void 0) {
    editablenumber_props.mode = ctx[3];
  }
  if (ctx[4] !== void 0) {
    editablenumber_props.value = ctx[4];
  }
  editablenumber = new EditableNumber({ props: editablenumber_props });
  binding_callbacks.push(() => bind(editablenumber, "mode", editablenumber_mode_binding));
  binding_callbacks.push(() => bind(editablenumber, "value", editablenumber_value_binding));
  editablenumber.$on("confirmed", ctx[6]);
  editablenumber.$on("cancelled", ctx[24]);
  return {
    c() {
      create_component(editablenumber.$$.fragment);
    },
    m(target, anchor) {
      mount_component(editablenumber, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const editablenumber_changes = {};
      if (!updating_mode && dirty & 8) {
        updating_mode = true;
        editablenumber_changes.mode = ctx2[3];
        add_flush_callback(() => updating_mode = false);
      }
      if (!updating_value && dirty & 16) {
        updating_value = true;
        editablenumber_changes.value = ctx2[4];
        add_flush_callback(() => updating_value = false);
      }
      editablenumber.$set(editablenumber_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(editablenumber.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(editablenumber.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(editablenumber, detaching);
    }
  };
}
function create_fragment$1(ctx) {
  let section;
  let div0;
  let editabletext;
  let updating_value;
  let t0;
  let div1;
  let trash2;
  let t1;
  let div2;
  let t2;
  let div3;
  let current_block_type_index;
  let if_block;
  let t3;
  let button0;
  let plussquare;
  let t4;
  let button1;
  let timer;
  let section_transition;
  let current;
  let mounted;
  let dispose;
  function editabletext_value_binding(value) {
    ctx[10](value);
  }
  let editabletext_props = {};
  if (ctx[0] !== void 0) {
    editabletext_props.value = ctx[0];
  }
  editabletext = new EditableText({ props: editabletext_props });
  binding_callbacks.push(() => bind(editabletext, "value", editabletext_value_binding));
  trash2 = new Trash2({});
  let each_value = ctx[1];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  }
  const out = (i) => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });
  const if_block_creators = [create_if_block$1, create_else_block];
  const if_blocks = [];
  function select_block_type_1(ctx2, dirty) {
    if (ctx2[2])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type_1(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  plussquare = new PlusSquare({});
  timer = new Timer$1({});
  return {
    c() {
      section = element("section");
      div0 = element("div");
      create_component(editabletext.$$.fragment);
      t0 = space();
      div1 = element("div");
      create_component(trash2.$$.fragment);
      t1 = space();
      div2 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t2 = space();
      div3 = element("div");
      if_block.c();
      t3 = space();
      button0 = element("button");
      create_component(plussquare.$$.fragment);
      t4 = space();
      button1 = element("button");
      create_component(timer.$$.fragment);
      attr(div0, "class", "progress-clocks-section__name");
      attr(div1, "role", "button");
      attr(div1, "tabindex", "0");
      attr(div1, "class", "progress-clocks-button progress-clocks-section__remove");
      attr(div2, "class", "progress-clocks-section__children");
      attr(button0, "class", "progress-clocks-section__add-counter");
      attr(button0, "title", "Add new counter");
      attr(button1, "class", "progress-clocks-section__add-stopwatch");
      attr(button1, "title", "Add new stopwatch");
      attr(div3, "class", "progress-clocks-section__add-child");
      attr(section, "class", "progress-clocks-section");
    },
    m(target, anchor) {
      insert(target, section, anchor);
      append(section, div0);
      mount_component(editabletext, div0, null);
      append(section, t0);
      append(section, div1);
      mount_component(trash2, div1, null);
      append(section, t1);
      append(section, div2);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div2, null);
        }
      }
      append(section, t2);
      append(section, div3);
      if_blocks[current_block_type_index].m(div3, null);
      append(div3, t3);
      append(div3, button0);
      mount_component(plussquare, button0, null);
      append(div3, t4);
      append(div3, button1);
      mount_component(timer, button1, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(div1, "click", ctx[5]),
          listen(div1, "contextmenu", ctx[5]),
          listen(div1, "keydown", ctx[5]),
          listen(button0, "click", ctx[7]),
          listen(button1, "click", ctx[8])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      const editabletext_changes = {};
      if (!updating_value && dirty & 1) {
        updating_value = true;
        editabletext_changes.value = ctx2[0];
        add_flush_callback(() => updating_value = false);
      }
      editabletext.$set(editabletext_changes);
      if (dirty & 514) {
        each_value = ctx2[1];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$1(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$1(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(div2, null);
          }
        }
        group_outros();
        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }
        check_outros();
      }
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_1(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(div3, t3);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(editabletext.$$.fragment, local);
      transition_in(trash2.$$.fragment, local);
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      transition_in(if_block);
      transition_in(plussquare.$$.fragment, local);
      transition_in(timer.$$.fragment, local);
      add_render_callback(() => {
        if (!current)
          return;
        if (!section_transition)
          section_transition = create_bidirectional_transition(section, fade, { duration: 100 }, true);
        section_transition.run(1);
      });
      current = true;
    },
    o(local) {
      transition_out(editabletext.$$.fragment, local);
      transition_out(trash2.$$.fragment, local);
      each_blocks = each_blocks.filter(Boolean);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      transition_out(if_block);
      transition_out(plussquare.$$.fragment, local);
      transition_out(timer.$$.fragment, local);
      if (!section_transition)
        section_transition = create_bidirectional_transition(section, fade, { duration: 100 }, false);
      section_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(section);
      destroy_component(editabletext);
      destroy_component(trash2);
      destroy_each(each_blocks, detaching);
      if_blocks[current_block_type_index].d();
      destroy_component(plussquare);
      destroy_component(timer);
      if (detaching && section_transition)
        section_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let { name } = $$props;
  let { children: children2 } = $$props;
  const dispatch2 = createEventDispatcher();
  function raiseRemoveSection(e) {
    if (e instanceof MouseEvent || ["Enter", " "].contains(e.key)) {
      dispatch2("removeSection", { self: this });
    }
  }
  let addingClock = false;
  let newClockMode = EditMode.Edit;
  let newClockSegments = 4;
  function addClock() {
    if (newClockMode !== EditMode.Read) {
      return;
    }
    if (newClockSegments < 1) {
      tick().then(() => {
        $$invalidate(3, newClockMode = EditMode.Edit);
      });
      return;
    }
    children2.push({
      type: "clock",
      name: `Clock ${children2.length + 1}`,
      segments: newClockSegments,
      filled: 0
    });
    $$invalidate(2, addingClock = false);
    $$invalidate(3, newClockMode = EditMode.Edit);
    $$invalidate(1, children2);
  }
  function addCounter() {
    children2.push({
      type: "counter",
      name: `Counter ${children2.length + 1}`,
      value: 0
    });
    $$invalidate(1, children2);
  }
  function addStopwatch() {
    children2.push({
      type: "stopwatch",
      name: `Stopwatch ${children2.length + 1}`,
      startMillis: new Date().getTime(),
      offsetMillis: 0,
      showMillis: false,
      isRunning: true,
      lapTimes: []
    });
    $$invalidate(1, children2);
  }
  function removeChild(i) {
    children2.splice(i, 1);
    $$invalidate(1, children2);
  }
  function editabletext_value_binding(value) {
    name = value;
    $$invalidate(0, name);
  }
  function clock_segments_binding(value, child) {
    if ($$self.$$.not_equal(child.segments, value)) {
      child.segments = value;
      $$invalidate(1, children2);
    }
  }
  function clock_filled_binding(value, child) {
    if ($$self.$$.not_equal(child.filled, value)) {
      child.filled = value;
      $$invalidate(1, children2);
    }
  }
  function counter_value_binding(value, child) {
    if ($$self.$$.not_equal(child.value, value)) {
      child.value = value;
      $$invalidate(1, children2);
    }
  }
  function stopwatch_startMillis_binding(value, child) {
    if ($$self.$$.not_equal(child.startMillis, value)) {
      child.startMillis = value;
      $$invalidate(1, children2);
    }
  }
  function stopwatch_offsetMillis_binding(value, child) {
    if ($$self.$$.not_equal(child.offsetMillis, value)) {
      child.offsetMillis = value;
      $$invalidate(1, children2);
    }
  }
  function stopwatch_showMillis_binding(value, child) {
    if ($$self.$$.not_equal(child.showMillis, value)) {
      child.showMillis = value;
      $$invalidate(1, children2);
    }
  }
  function stopwatch_isRunning_binding(value, child) {
    if ($$self.$$.not_equal(child.isRunning, value)) {
      child.isRunning = value;
      $$invalidate(1, children2);
    }
  }
  function stopwatch_lapTimes_binding(value, child) {
    if ($$self.$$.not_equal(child.lapTimes, value)) {
      child.lapTimes = value;
      $$invalidate(1, children2);
    }
  }
  function editabletext_value_binding_1(value, child) {
    if ($$self.$$.not_equal(child.name, value)) {
      child.name = value;
      $$invalidate(1, children2);
    }
  }
  const click_handler = (i) => removeChild(i);
  const keydown_handler = (i) => removeChild(i);
  function editablenumber_mode_binding(value) {
    newClockMode = value;
    $$invalidate(3, newClockMode);
  }
  function editablenumber_value_binding(value) {
    newClockSegments = value;
    $$invalidate(4, newClockSegments);
  }
  const cancelled_handler = () => {
    $$invalidate(2, addingClock = false);
    $$invalidate(3, newClockMode = EditMode.Edit);
  };
  const click_handler_1 = () => $$invalidate(2, addingClock = true);
  $$self.$$set = ($$props2) => {
    if ("name" in $$props2)
      $$invalidate(0, name = $$props2.name);
    if ("children" in $$props2)
      $$invalidate(1, children2 = $$props2.children);
  };
  return [
    name,
    children2,
    addingClock,
    newClockMode,
    newClockSegments,
    raiseRemoveSection,
    addClock,
    addCounter,
    addStopwatch,
    removeChild,
    editabletext_value_binding,
    clock_segments_binding,
    clock_filled_binding,
    counter_value_binding,
    stopwatch_startMillis_binding,
    stopwatch_offsetMillis_binding,
    stopwatch_showMillis_binding,
    stopwatch_isRunning_binding,
    stopwatch_lapTimes_binding,
    editabletext_value_binding_1,
    click_handler,
    keydown_handler,
    editablenumber_mode_binding,
    editablenumber_value_binding,
    cancelled_handler,
    click_handler_1
  ];
}
class Section extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0, children: 1 });
  }
}
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[9] = list[i];
  child_ctx[10] = list;
  child_ctx[11] = i;
  return child_ctx;
}
function create_if_block_2(ctx) {
  let header;
  return {
    c() {
      header = element("header");
      header.innerHTML = `<span class="progress-clocks-title__main-title">Progress Clocks</span> 
      <a class="progress-clocks-title__subtitle" href="https://github.com/tokenshift/obsidian-progress-clocks">https://github.com/tokenshift/obsidian-progress-clocks</a>`;
      attr(header, "class", "progress-clocks-title");
    },
    m(target, anchor) {
      insert(target, header, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(header);
    }
  };
}
function create_each_block(ctx) {
  let section;
  let updating_name;
  let updating_children;
  let current;
  function section_name_binding(value) {
    ctx[5](value, ctx[9]);
  }
  function section_children_binding(value) {
    ctx[6](value, ctx[9]);
  }
  function removeSection_handler() {
    return ctx[7](ctx[11]);
  }
  let section_props = {};
  if (ctx[9].name !== void 0) {
    section_props.name = ctx[9].name;
  }
  if (ctx[9].children !== void 0) {
    section_props.children = ctx[9].children;
  }
  section = new Section({ props: section_props });
  binding_callbacks.push(() => bind(section, "name", section_name_binding));
  binding_callbacks.push(() => bind(section, "children", section_children_binding));
  section.$on("removeSection", removeSection_handler);
  return {
    c() {
      create_component(section.$$.fragment);
    },
    m(target, anchor) {
      mount_component(section, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const section_changes = {};
      if (!updating_name && dirty & 1) {
        updating_name = true;
        section_changes.name = ctx[9].name;
        add_flush_callback(() => updating_name = false);
      }
      if (!updating_children && dirty & 1) {
        updating_children = true;
        section_changes.children = ctx[9].children;
        add_flush_callback(() => updating_children = false);
      }
      section.$set(section_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(section.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(section.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(section, detaching);
    }
  };
}
function create_if_block_1(ctx) {
  let pre;
  let t0;
  let t1_value = JSON.stringify(ctx[0], null, 2) + "";
  let t1;
  let t2;
  return {
    c() {
      pre = element("pre");
      t0 = text("  ");
      t1 = text(t1_value);
      t2 = text("\n  ");
      attr(pre, "class", "progress-clocks-debug");
    },
    m(target, anchor) {
      insert(target, pre, anchor);
      append(pre, t0);
      append(pre, t1);
      append(pre, t2);
    },
    p(ctx2, dirty) {
      if (dirty & 1 && t1_value !== (t1_value = JSON.stringify(ctx2[0], null, 2) + ""))
        set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching)
        detach(pre);
    }
  };
}
function create_if_block(ctx) {
  let div;
  let t0;
  let t1;
  return {
    c() {
      div = element("div");
      t0 = text("Counters v");
      t1 = text(ctx[1]);
      attr(div, "class", "progress-clocks-panel__version");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
    },
    p(ctx2, dirty) {
      if (dirty & 2)
        set_data(t1, ctx2[1]);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment(ctx) {
  let div1;
  let t0;
  let t1;
  let div0;
  let t3;
  let t4;
  let current;
  let mounted;
  let dispose;
  let if_block0 = ctx[2] && create_if_block_2();
  let each_value = ctx[0].sections;
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  const out = (i) => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });
  let if_block1 = ctx[0].debug && create_if_block_1(ctx);
  let if_block2 = ctx[1] && create_if_block(ctx);
  return {
    c() {
      div1 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t1 = space();
      div0 = element("div");
      div0.textContent = "Add Section";
      t3 = space();
      if (if_block1)
        if_block1.c();
      t4 = space();
      if (if_block2)
        if_block2.c();
      attr(div0, "class", "progress-clocks-button progress-clocks-panel__add-section");
      attr(div0, "role", "button");
      attr(div0, "tabindex", "0");
      attr(div1, "class", "progress-clocks progress-clocks-panel");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (if_block0)
        if_block0.m(div1, null);
      append(div1, t0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div1, null);
        }
      }
      append(div1, t1);
      append(div1, div0);
      append(div1, t3);
      if (if_block1)
        if_block1.m(div1, null);
      append(div1, t4);
      if (if_block2)
        if_block2.m(div1, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(div0, "keydown", ifClickEquivalent(ctx[3])),
          listen(div0, "click", ctx[3])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (ctx2[2]) {
        if (if_block0)
          ;
        else {
          if_block0 = create_if_block_2();
          if_block0.c();
          if_block0.m(div1, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & 17) {
        each_value = ctx2[0].sections;
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(div1, t1);
          }
        }
        group_outros();
        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }
        check_outros();
      }
      if (ctx2[0].debug) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_1(ctx2);
          if_block1.c();
          if_block1.m(div1, t4);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (ctx2[1]) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block(ctx2);
          if_block2.c();
          if_block2.m(div1, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block0)
        if_block0.d();
      destroy_each(each_blocks, detaching);
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  const dispatch2 = createEventDispatcher();
  let { state = new State() } = $$props;
  let { version } = $$props;
  let { showTitle = false } = $$props;
  function addSection() {
    state.sections.push({
      name: `Section ${state.sections.length + 1}`,
      children: []
    });
    $$invalidate(0, state);
  }
  function removeSection(i) {
    state.sections.splice(i, 1);
    $$invalidate(0, state);
  }
  function section_name_binding(value, section) {
    if ($$self.$$.not_equal(section.name, value)) {
      section.name = value;
      $$invalidate(0, state);
    }
  }
  function section_children_binding(value, section) {
    if ($$self.$$.not_equal(section.children, value)) {
      section.children = value;
      $$invalidate(0, state);
    }
  }
  const removeSection_handler = (i) => removeSection(i);
  $$self.$$set = ($$props2) => {
    if ("state" in $$props2)
      $$invalidate(0, state = $$props2.state);
    if ("version" in $$props2)
      $$invalidate(1, version = $$props2.version);
    if ("showTitle" in $$props2)
      $$invalidate(2, showTitle = $$props2.showTitle);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1) {
      dispatch2("stateUpdated", { state });
    }
  };
  return [
    state,
    version,
    showTitle,
    addSection,
    removeSection,
    section_name_binding,
    section_children_binding,
    removeSection_handler
  ];
}
class Panel extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, { state: 0, version: 1, showTitle: 2 });
  }
}
const DISPLAY_TEXT = "Progress Clocks";
const ICON = "pie-chart";
const VIEW_TYPE = "PROGRESS_CLOCKS_VIEW";
const DEBOUNCE_SAVE_STATE_TIME = 1e3;
class ProgressClocksView extends obsidian.ItemView {
  constructor(plugin, leaf) {
    super(leaf);
    __publicField(this, "navigation", false);
    this.plugin = plugin;
    this.leaf = leaf;
  }
  getDisplayText() {
    return DISPLAY_TEXT;
  }
  getIcon() {
    return ICON;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  async onOpen() {
    this.contentEl.empty();
    const data = await this.plugin.loadData();
    const state = (data == null ? void 0 : data.state) || { sections: [] };
    const panel = new Panel({
      target: this.contentEl,
      props: {
        showTitle: true,
        state,
        version: this.plugin.manifest.version
      }
    });
    panel.$on("stateUpdated", obsidian.debounce(({ detail: { state: state2 } }) => {
      this.plugin.saveData({ state: state2 });
    }, DEBOUNCE_SAVE_STATE_TIME, true));
  }
}
class ClockWidget extends view.WidgetType {
  constructor(segments = 4, filled = 0, nodeFrom, nodeTo) {
    super();
    this.segments = segments;
    this.filled = filled;
    this.nodeFrom = nodeFrom;
    this.nodeTo = nodeTo;
  }
  toDOM(view2) {
    const container = document.createElement("div");
    container.addClass("progress-clocks-inline");
    const clock = new Clock({
      target: container,
      props: {
        segments: this.segments,
        filled: this.filled
      }
    });
    clock.$on("updated", (event) => {
      const {
        detail: {
          segments,
          filled
        }
      } = event;
      view2.dispatch({
        changes: {
          from: this.nodeFrom,
          to: this.nodeTo,
          insert: `clock ${filled} / ${segments}`
        }
      });
    });
    return container;
  }
}
class CounterWidget extends view.WidgetType {
  constructor(value = 0, nodeFrom, nodeTo) {
    super();
    this.value = value;
    this.nodeFrom = nodeFrom;
    this.nodeTo = nodeTo;
  }
  toDOM(view2) {
    const container = document.createElement("div");
    container.addClass("progress-clocks-inline");
    const counter = new Counter({
      target: container,
      props: {
        value: this.value
      }
    });
    counter.$on("updated", (event) => {
      const {
        detail: {
          value
        }
      } = event;
      view2.dispatch({
        changes: {
          from: this.nodeFrom,
          to: this.nodeTo,
          insert: `counter ${value}`
        }
      });
    });
    return container;
  }
}
const DEFAULT_CLOCK_SEGMENTS = 4;
const CLOCK_PATTERN = new RegExp(/clock(?:\s+(\d+)\s*(?:\/\s*(\d+))?)?/i);
const COUNTER_PATTERN = new RegExp(/counter(?:\s+(\d+))?/i);
function isSelectionWithin(selection, rangeFrom, rangeTo) {
  for (const range of selection.ranges) {
    if (range.from <= rangeTo && range.to >= rangeFrom) {
      return true;
    }
  }
  return false;
}
function parseCode(input) {
  input = input.trim();
  let match = CLOCK_PATTERN.exec(input);
  if (match) {
    const segments = match[2] ? Number(match[2]) : match[1] ? Number(match[1]) : DEFAULT_CLOCK_SEGMENTS;
    const filled = match[2] ? Number(match[1]) : 0;
    return {
      type: "clock",
      segments,
      filled
    };
  }
  match = COUNTER_PATTERN.exec(input);
  if (match) {
    const value = match[1] ? Number(match[1]) : 0;
    return {
      type: "counter",
      value
    };
  }
  return null;
}
class InlinePlugin {
  constructor(view$1) {
    __publicField(this, "decorations");
    this.decorations = view.Decoration.none;
  }
  update(update2) {
    if (update2.docChanged || update2.viewportChanged || update2.selectionSet) {
      if (update2.state.field(obsidian.editorLivePreviewField)) {
        this.decorations = this.inlineRender(update2.view);
      } else {
        this.decorations = view.Decoration.none;
      }
    }
  }
  inlineRender(view$1) {
    const widgets = [];
    for (const { from, to } of view$1.visibleRanges) {
      language.syntaxTree(view$1.state).iterate({
        from,
        to,
        enter: ({ node }) => {
          if (/formatting/.test(node.name)) {
            return;
          }
          if (!/.*?_?inline-code_?.*/.test(node.name)) {
            return;
          }
          if (isSelectionWithin(view$1.state.selection, node.from, node.to)) {
            return;
          }
          const src = view$1.state.doc.sliceString(node.from, node.to).trim();
          const parsed = parseCode(src);
          if (!parsed) {
            return;
          }
          switch (parsed.type) {
            case "clock":
              const { segments, filled } = parsed;
              widgets.push(view.Decoration.replace({
                widget: new ClockWidget(segments, filled, node.from, node.to)
              }).range(node.from, node.to));
              break;
            case "counter":
              const { value } = parsed;
              widgets.push(view.Decoration.replace({
                widget: new CounterWidget(value, node.from, node.to)
              }).range(node.from, node.to));
              break;
          }
        }
      });
    }
    return view.Decoration.set(widgets);
  }
}
function inlinePlugin(plugin) {
  return view.ViewPlugin.fromClass(InlinePlugin, {
    decorations: (view2) => view2.decorations
  });
}
class ProgressClocksPlugin extends obsidian.Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE,
      (leaf) => new ProgressClocksView(this, leaf)
    );
    this.addView();
    this.addCommand({
      id: "open-panel",
      name: "Open the sidebar view",
      callback: async () => {
        const leaf = await this.addView();
        if (leaf) {
          this.app.workspace.revealLeaf(leaf);
        }
      }
    });
    this.registerEditorExtension(inlinePlugin());
    this.registerMarkdownPostProcessor(this.handleMarkdownPostProcessor.bind(this));
  }
  async addView() {
    var _a, _b;
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
      return this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    }
    await ((_b = (_a = this.app.workspace) == null ? void 0 : _a.getRightLeaf(false)) == null ? void 0 : _b.setViewState({
      type: VIEW_TYPE
    }));
    return this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
  }
  async handleMarkdownPostProcessor(el, ctx) {
    const nodes = el.querySelectorAll("code");
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      const parsed = parseCode(node.innerText);
      if (!parsed) {
        continue;
      }
      const container = document.createElement("div");
      container.addClass("progress-clocks-inline");
      switch (parsed.type) {
        case "clock":
          const { segments, filled } = parsed;
          new Clock({
            target: container,
            props: {
              segments,
              filled
            }
          });
          node.replaceWith(container);
          break;
        case "counter":
          const { value } = parsed;
          new Counter({
            target: container,
            props: {
              value
            }
          });
          node.replaceWith(container);
          break;
      }
    }
  }
}
module.exports = ProgressClocksPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3N2ZWx0ZS9pbnRlcm5hbC9pbmRleC5tanMiLCJzcmMvU3RhdGUudHMiLCJub2RlX21vZHVsZXMvbHVjaWRlLXN2ZWx0ZS9kaXN0L2RlZmF1bHRBdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL2x1Y2lkZS1zdmVsdGUvZGlzdC9JY29uLnN2ZWx0ZSIsIm5vZGVfbW9kdWxlcy9sdWNpZGUtc3ZlbHRlL2Rpc3QvaWNvbnMvYXJyb3ctZG93bi1mcm9tLWxpbmUuc3ZlbHRlIiwibm9kZV9tb2R1bGVzL2x1Y2lkZS1zdmVsdGUvZGlzdC9pY29ucy9hcnJvdy11cC1mcm9tLWxpbmUuc3ZlbHRlIiwibm9kZV9tb2R1bGVzL2x1Y2lkZS1zdmVsdGUvZGlzdC9pY29ucy9taW51cy1zcXVhcmUuc3ZlbHRlIiwibm9kZV9tb2R1bGVzL2x1Y2lkZS1zdmVsdGUvZGlzdC9pY29ucy9wYXVzZS5zdmVsdGUiLCJub2RlX21vZHVsZXMvbHVjaWRlLXN2ZWx0ZS9kaXN0L2ljb25zL3BpZS1jaGFydC5zdmVsdGUiLCJub2RlX21vZHVsZXMvbHVjaWRlLXN2ZWx0ZS9kaXN0L2ljb25zL3BsYXkuc3ZlbHRlIiwibm9kZV9tb2R1bGVzL2x1Y2lkZS1zdmVsdGUvZGlzdC9pY29ucy9wbHVzLXNxdWFyZS5zdmVsdGUiLCJub2RlX21vZHVsZXMvbHVjaWRlLXN2ZWx0ZS9kaXN0L2ljb25zL3JlZnJlc2gtY2N3LnN2ZWx0ZSIsIm5vZGVfbW9kdWxlcy9sdWNpZGUtc3ZlbHRlL2Rpc3QvaWNvbnMvdGltZXIuc3ZlbHRlIiwibm9kZV9tb2R1bGVzL2x1Y2lkZS1zdmVsdGUvZGlzdC9pY29ucy90cmFzaC0yLnN2ZWx0ZSIsIm5vZGVfbW9kdWxlcy9zdmVsdGUvdHJhbnNpdGlvbi9pbmRleC5tanMiLCJzcmMvdWkvdXRpbC50cyIsInNyYy91aS9FZGl0YWJsZVRleHQuc3ZlbHRlIiwic3JjL3VpL0VkaXRhYmxlTnVtYmVyLnN2ZWx0ZSIsInNyYy91aS9DbG9jay5zdmVsdGUiLCJzcmMvdWkvQ291bnRlci5zdmVsdGUiLCJzcmMvdWkvU3RvcFdhdGNoLnN2ZWx0ZSIsInNyYy91aS9TZWN0aW9uLnN2ZWx0ZSIsInNyYy91aS9QYW5lbC5zdmVsdGUiLCJzcmMvUHJvZ3Jlc3NDbG9ja3NWaWV3LnRzIiwic3JjL2lubGluZS9DbG9ja1dpZGdldC50cyIsInNyYy9pbmxpbmUvQ291bnRlcldpZGdldC50cyIsInNyYy9pbmxpbmUvSW5saW5lUGx1Z2luLnRzIiwic3JjL1Byb2dyZXNzQ2xvY2tzUGx1Z2luLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuLy8gQWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS90aGVuL2lzLXByb21pc2UvYmxvYi9tYXN0ZXIvaW5kZXguanNcbi8vIERpc3RyaWJ1dGVkIHVuZGVyIE1JVCBMaWNlbnNlIGh0dHBzOi8vZ2l0aHViLmNvbS90aGVuL2lzLXByb21pc2UvYmxvYi9tYXN0ZXIvTElDRU5TRVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiAhIXZhbHVlICYmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBhZGRfbG9jYXRpb24oZWxlbWVudCwgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyKSB7XG4gICAgZWxlbWVudC5fX3N2ZWx0ZV9tZXRhID0ge1xuICAgICAgICBsb2M6IHsgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gcnVuKGZuKSB7XG4gICAgcmV0dXJuIGZuKCk7XG59XG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuICAgIGZucy5mb3JFYWNoKHJ1bik7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxubGV0IHNyY191cmxfZXF1YWxfYW5jaG9yO1xuZnVuY3Rpb24gc3JjX3VybF9lcXVhbChlbGVtZW50X3NyYywgdXJsKSB7XG4gICAgaWYgKCFzcmNfdXJsX2VxdWFsX2FuY2hvcikge1xuICAgICAgICBzcmNfdXJsX2VxdWFsX2FuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICB9XG4gICAgc3JjX3VybF9lcXVhbF9hbmNob3IuaHJlZiA9IHVybDtcbiAgICByZXR1cm4gZWxlbWVudF9zcmMgPT09IHNyY191cmxfZXF1YWxfYW5jaG9yLmhyZWY7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAoJCRzY29wZS5kaXJ0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxldHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdF9iYXNlKHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBzbG90X2NoYW5nZXMsIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBpZiAoc2xvdF9jaGFuZ2VzKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY29udGV4dCA9IGdldF9zbG90X2NvbnRleHQoc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGdldF9zbG90X2NvbnRleHRfZm4pO1xuICAgICAgICBzbG90LnAoc2xvdF9jb250ZXh0LCBzbG90X2NoYW5nZXMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90KHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbiwgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGNvbnN0IHNsb3RfY2hhbmdlcyA9IGdldF9zbG90X2NoYW5nZXMoc2xvdF9kZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbik7XG4gICAgdXBkYXRlX3Nsb3RfYmFzZShzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbn1cbmZ1bmN0aW9uIGdldF9hbGxfZGlydHlfZnJvbV9zY29wZSgkJHNjb3BlKSB7XG4gICAgaWYgKCQkc2NvcGUuY3R4Lmxlbmd0aCA+IDMyKSB7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gW107XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9ICQkc2NvcGUuY3R4Lmxlbmd0aCAvIDMyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkaXJ0eVtpXSA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Jlc3RfcHJvcHMocHJvcHMsIGtleXMpIHtcbiAgICBjb25zdCByZXN0ID0ge307XG4gICAga2V5cyA9IG5ldyBTZXQoa2V5cyk7XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoIWtleXMuaGFzKGspICYmIGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3Rba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfc2xvdHMoc2xvdHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzbG90cykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlKSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuZnVuY3Rpb24gc3BsaXRfY3NzX3VuaXQodmFsdWUpIHtcbiAgICBjb25zdCBzcGxpdCA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUubWF0Y2goL15cXHMqKC0/W1xcZC5dKykoW15cXHNdKilcXHMqJC8pO1xuICAgIHJldHVybiBzcGxpdCA/IFtwYXJzZUZsb2F0KHNwbGl0WzFdKSwgc3BsaXRbMl0gfHwgJ3B4J10gOiBbdmFsdWUsICdweCddO1xufVxuY29uc3QgY29udGVudGVkaXRhYmxlX3RydXRoeV92YWx1ZXMgPSBbJycsIHRydWUsIDEsICd0cnVlJywgJ2NvbnRlbnRlZGl0YWJsZSddO1xuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuY29uc3QgZ2xvYmFscyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgID8gd2luZG93XG4gICAgOiB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgPyBnbG9iYWxUaGlzXG4gICAgICAgIDogZ2xvYmFsKTtcblxuLyoqXG4gKiBSZXNpemUgb2JzZXJ2ZXIgc2luZ2xldG9uLlxuICogT25lIGxpc3RlbmVyIHBlciBlbGVtZW50IG9ubHkhXG4gKiBodHRwczovL2dyb3Vwcy5nb29nbGUuY29tL2EvY2hyb21pdW0ub3JnL2cvYmxpbmstZGV2L2MvejZpZW5PTlViNUEvbS9GNS1WY1VadEJBQUpcbiAqL1xuY2xhc3MgUmVzaXplT2JzZXJ2ZXJTaW5nbGV0b24ge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzID0gJ1dlYWtNYXAnIGluIGdsb2JhbHMgPyBuZXcgV2Vha01hcCgpIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBvYnNlcnZlKGVsZW1lbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVycy5zZXQoZWxlbWVudCwgbGlzdGVuZXIpO1xuICAgICAgICB0aGlzLl9nZXRPYnNlcnZlcigpLm9ic2VydmUoZWxlbWVudCwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVycy5kZWxldGUoZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLl9vYnNlcnZlci51bm9ic2VydmUoZWxlbWVudCk7IC8vIHRoaXMgbGluZSBjYW4gcHJvYmFibHkgYmUgcmVtb3ZlZFxuICAgICAgICB9O1xuICAgIH1cbiAgICBfZ2V0T2JzZXJ2ZXIoKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgcmV0dXJuIChfYSA9IHRoaXMuX29ic2VydmVyKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAodGhpcy5fb2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKGVudHJpZXMpID0+IHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICAgICAgICAgIFJlc2l6ZU9ic2VydmVyU2luZ2xldG9uLmVudHJpZXMuc2V0KGVudHJ5LnRhcmdldCwgZW50cnkpO1xuICAgICAgICAgICAgICAgIChfYSA9IHRoaXMuX2xpc3RlbmVycy5nZXQoZW50cnkudGFyZ2V0KSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hKGVudHJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbi8vIE5lZWRzIHRvIGJlIHdyaXR0ZW4gbGlrZSB0aGlzIHRvIHBhc3MgdGhlIHRyZWUtc2hha2UtdGVzdFxuUmVzaXplT2JzZXJ2ZXJTaW5nbGV0b24uZW50cmllcyA9ICdXZWFrTWFwJyBpbiBnbG9iYWxzID8gbmV3IFdlYWtNYXAoKSA6IHVuZGVmaW5lZDtcblxuLy8gVHJhY2sgd2hpY2ggbm9kZXMgYXJlIGNsYWltZWQgZHVyaW5nIGh5ZHJhdGlvbi4gVW5jbGFpbWVkIG5vZGVzIGNhbiB0aGVuIGJlIHJlbW92ZWQgZnJvbSB0aGUgRE9NXG4vLyBhdCB0aGUgZW5kIG9mIGh5ZHJhdGlvbiB3aXRob3V0IHRvdWNoaW5nIHRoZSByZW1haW5pbmcgbm9kZXMuXG5sZXQgaXNfaHlkcmF0aW5nID0gZmFsc2U7XG5mdW5jdGlvbiBzdGFydF9oeWRyYXRpbmcoKSB7XG4gICAgaXNfaHlkcmF0aW5nID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGVuZF9oeWRyYXRpbmcoKSB7XG4gICAgaXNfaHlkcmF0aW5nID0gZmFsc2U7XG59XG5mdW5jdGlvbiB1cHBlcl9ib3VuZChsb3csIGhpZ2gsIGtleSwgdmFsdWUpIHtcbiAgICAvLyBSZXR1cm4gZmlyc3QgaW5kZXggb2YgdmFsdWUgbGFyZ2VyIHRoYW4gaW5wdXQgdmFsdWUgaW4gdGhlIHJhbmdlIFtsb3csIGhpZ2gpXG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgICAgY29uc3QgbWlkID0gbG93ICsgKChoaWdoIC0gbG93KSA+PiAxKTtcbiAgICAgICAgaWYgKGtleShtaWQpIDw9IHZhbHVlKSB7XG4gICAgICAgICAgICBsb3cgPSBtaWQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGlnaCA9IG1pZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG93O1xufVxuZnVuY3Rpb24gaW5pdF9oeWRyYXRlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuaHlkcmF0ZV9pbml0KVxuICAgICAgICByZXR1cm47XG4gICAgdGFyZ2V0Lmh5ZHJhdGVfaW5pdCA9IHRydWU7XG4gICAgLy8gV2Uga25vdyB0aGF0IGFsbCBjaGlsZHJlbiBoYXZlIGNsYWltX29yZGVyIHZhbHVlcyBzaW5jZSB0aGUgdW5jbGFpbWVkIGhhdmUgYmVlbiBkZXRhY2hlZCBpZiB0YXJnZXQgaXMgbm90IDxoZWFkPlxuICAgIGxldCBjaGlsZHJlbiA9IHRhcmdldC5jaGlsZE5vZGVzO1xuICAgIC8vIElmIHRhcmdldCBpcyA8aGVhZD4sIHRoZXJlIG1heSBiZSBjaGlsZHJlbiB3aXRob3V0IGNsYWltX29yZGVyXG4gICAgaWYgKHRhcmdldC5ub2RlTmFtZSA9PT0gJ0hFQUQnKSB7XG4gICAgICAgIGNvbnN0IG15Q2hpbGRyZW4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG15Q2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjaGlsZHJlbiA9IG15Q2hpbGRyZW47XG4gICAgfVxuICAgIC8qXG4gICAgKiBSZW9yZGVyIGNsYWltZWQgY2hpbGRyZW4gb3B0aW1hbGx5LlxuICAgICogV2UgY2FuIHJlb3JkZXIgY2xhaW1lZCBjaGlsZHJlbiBvcHRpbWFsbHkgYnkgZmluZGluZyB0aGUgbG9uZ2VzdCBzdWJzZXF1ZW5jZSBvZlxuICAgICogbm9kZXMgdGhhdCBhcmUgYWxyZWFkeSBjbGFpbWVkIGluIG9yZGVyIGFuZCBvbmx5IG1vdmluZyB0aGUgcmVzdC4gVGhlIGxvbmdlc3RcbiAgICAqIHN1YnNlcXVlbmNlIG9mIG5vZGVzIHRoYXQgYXJlIGNsYWltZWQgaW4gb3JkZXIgY2FuIGJlIGZvdW5kIGJ5XG4gICAgKiBjb21wdXRpbmcgdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiAuY2xhaW1fb3JkZXIgdmFsdWVzLlxuICAgICpcbiAgICAqIFRoaXMgYWxnb3JpdGhtIGlzIG9wdGltYWwgaW4gZ2VuZXJhdGluZyB0aGUgbGVhc3QgYW1vdW50IG9mIHJlb3JkZXIgb3BlcmF0aW9uc1xuICAgICogcG9zc2libGUuXG4gICAgKlxuICAgICogUHJvb2Y6XG4gICAgKiBXZSBrbm93IHRoYXQsIGdpdmVuIGEgc2V0IG9mIHJlb3JkZXJpbmcgb3BlcmF0aW9ucywgdGhlIG5vZGVzIHRoYXQgZG8gbm90IG1vdmVcbiAgICAqIGFsd2F5cyBmb3JtIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2UsIHNpbmNlIHRoZXkgZG8gbm90IG1vdmUgYW1vbmcgZWFjaCBvdGhlclxuICAgICogbWVhbmluZyB0aGF0IHRoZXkgbXVzdCBiZSBhbHJlYWR5IG9yZGVyZWQgYW1vbmcgZWFjaCBvdGhlci4gVGh1cywgdGhlIG1heGltYWxcbiAgICAqIHNldCBvZiBub2RlcyB0aGF0IGRvIG5vdCBtb3ZlIGZvcm0gYSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2UuXG4gICAgKi9cbiAgICAvLyBDb21wdXRlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZVxuICAgIC8vIG06IHN1YnNlcXVlbmNlIGxlbmd0aCBqID0+IGluZGV4IGsgb2Ygc21hbGxlc3QgdmFsdWUgdGhhdCBlbmRzIGFuIGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2YgbGVuZ3RoIGpcbiAgICBjb25zdCBtID0gbmV3IEludDMyQXJyYXkoY2hpbGRyZW4ubGVuZ3RoICsgMSk7XG4gICAgLy8gUHJlZGVjZXNzb3IgaW5kaWNlcyArIDFcbiAgICBjb25zdCBwID0gbmV3IEludDMyQXJyYXkoY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICBtWzBdID0gLTE7XG4gICAgbGV0IGxvbmdlc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGNoaWxkcmVuW2ldLmNsYWltX29yZGVyO1xuICAgICAgICAvLyBGaW5kIHRoZSBsYXJnZXN0IHN1YnNlcXVlbmNlIGxlbmd0aCBzdWNoIHRoYXQgaXQgZW5kcyBpbiBhIHZhbHVlIGxlc3MgdGhhbiBvdXIgY3VycmVudCB2YWx1ZVxuICAgICAgICAvLyB1cHBlcl9ib3VuZCByZXR1cm5zIGZpcnN0IGdyZWF0ZXIgdmFsdWUsIHNvIHdlIHN1YnRyYWN0IG9uZVxuICAgICAgICAvLyB3aXRoIGZhc3QgcGF0aCBmb3Igd2hlbiB3ZSBhcmUgb24gdGhlIGN1cnJlbnQgbG9uZ2VzdCBzdWJzZXF1ZW5jZVxuICAgICAgICBjb25zdCBzZXFMZW4gPSAoKGxvbmdlc3QgPiAwICYmIGNoaWxkcmVuW21bbG9uZ2VzdF1dLmNsYWltX29yZGVyIDw9IGN1cnJlbnQpID8gbG9uZ2VzdCArIDEgOiB1cHBlcl9ib3VuZCgxLCBsb25nZXN0LCBpZHggPT4gY2hpbGRyZW5bbVtpZHhdXS5jbGFpbV9vcmRlciwgY3VycmVudCkpIC0gMTtcbiAgICAgICAgcFtpXSA9IG1bc2VxTGVuXSArIDE7XG4gICAgICAgIGNvbnN0IG5ld0xlbiA9IHNlcUxlbiArIDE7XG4gICAgICAgIC8vIFdlIGNhbiBndWFyYW50ZWUgdGhhdCBjdXJyZW50IGlzIHRoZSBzbWFsbGVzdCB2YWx1ZS4gT3RoZXJ3aXNlLCB3ZSB3b3VsZCBoYXZlIGdlbmVyYXRlZCBhIGxvbmdlciBzZXF1ZW5jZS5cbiAgICAgICAgbVtuZXdMZW5dID0gaTtcbiAgICAgICAgbG9uZ2VzdCA9IE1hdGgubWF4KG5ld0xlbiwgbG9uZ2VzdCk7XG4gICAgfVxuICAgIC8vIFRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugb2Ygbm9kZXMgKGluaXRpYWxseSByZXZlcnNlZClcbiAgICBjb25zdCBsaXMgPSBbXTtcbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbm9kZXMsIG5vZGVzIHRoYXQgd2lsbCBiZSBtb3ZlZFxuICAgIGNvbnN0IHRvTW92ZSA9IFtdO1xuICAgIGxldCBsYXN0ID0gY2hpbGRyZW4ubGVuZ3RoIC0gMTtcbiAgICBmb3IgKGxldCBjdXIgPSBtW2xvbmdlc3RdICsgMTsgY3VyICE9IDA7IGN1ciA9IHBbY3VyIC0gMV0pIHtcbiAgICAgICAgbGlzLnB1c2goY2hpbGRyZW5bY3VyIC0gMV0pO1xuICAgICAgICBmb3IgKDsgbGFzdCA+PSBjdXI7IGxhc3QtLSkge1xuICAgICAgICAgICAgdG9Nb3ZlLnB1c2goY2hpbGRyZW5bbGFzdF0pO1xuICAgICAgICB9XG4gICAgICAgIGxhc3QtLTtcbiAgICB9XG4gICAgZm9yICg7IGxhc3QgPj0gMDsgbGFzdC0tKSB7XG4gICAgICAgIHRvTW92ZS5wdXNoKGNoaWxkcmVuW2xhc3RdKTtcbiAgICB9XG4gICAgbGlzLnJldmVyc2UoKTtcbiAgICAvLyBXZSBzb3J0IHRoZSBub2RlcyBiZWluZyBtb3ZlZCB0byBndWFyYW50ZWUgdGhhdCB0aGVpciBpbnNlcnRpb24gb3JkZXIgbWF0Y2hlcyB0aGUgY2xhaW0gb3JkZXJcbiAgICB0b01vdmUuc29ydCgoYSwgYikgPT4gYS5jbGFpbV9vcmRlciAtIGIuY2xhaW1fb3JkZXIpO1xuICAgIC8vIEZpbmFsbHksIHdlIG1vdmUgdGhlIG5vZGVzXG4gICAgZm9yIChsZXQgaSA9IDAsIGogPSAwOyBpIDwgdG9Nb3ZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdoaWxlIChqIDwgbGlzLmxlbmd0aCAmJiB0b01vdmVbaV0uY2xhaW1fb3JkZXIgPj0gbGlzW2pdLmNsYWltX29yZGVyKSB7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYW5jaG9yID0gaiA8IGxpcy5sZW5ndGggPyBsaXNbal0gOiBudWxsO1xuICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKHRvTW92ZVtpXSwgYW5jaG9yKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX3N0eWxlcyh0YXJnZXQsIHN0eWxlX3NoZWV0X2lkLCBzdHlsZXMpIHtcbiAgICBjb25zdCBhcHBlbmRfc3R5bGVzX3RvID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKHRhcmdldCk7XG4gICAgaWYgKCFhcHBlbmRfc3R5bGVzX3RvLmdldEVsZW1lbnRCeUlkKHN0eWxlX3NoZWV0X2lkKSkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gc3R5bGVfc2hlZXRfaWQ7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gc3R5bGVzO1xuICAgICAgICBhcHBlbmRfc3R5bGVzaGVldChhcHBlbmRfc3R5bGVzX3RvLCBzdHlsZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICBjb25zdCByb290ID0gbm9kZS5nZXRSb290Tm9kZSA/IG5vZGUuZ2V0Um9vdE5vZGUoKSA6IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBpZiAocm9vdCAmJiByb290Lmhvc3QpIHtcbiAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfVxuICAgIHJldHVybiBub2RlLm93bmVyRG9jdW1lbnQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfZW1wdHlfc3R5bGVzaGVldChub2RlKSB7XG4gICAgY29uc3Qgc3R5bGVfZWxlbWVudCA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgYXBwZW5kX3N0eWxlc2hlZXQoZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpLCBzdHlsZV9lbGVtZW50KTtcbiAgICByZXR1cm4gc3R5bGVfZWxlbWVudC5zaGVldDtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXNoZWV0KG5vZGUsIHN0eWxlKSB7XG4gICAgYXBwZW5kKG5vZGUuaGVhZCB8fCBub2RlLCBzdHlsZSk7XG4gICAgcmV0dXJuIHN0eWxlLnNoZWV0O1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUpIHtcbiAgICBpZiAoaXNfaHlkcmF0aW5nKSB7XG4gICAgICAgIGluaXRfaHlkcmF0ZSh0YXJnZXQpO1xuICAgICAgICBpZiAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID09PSB1bmRlZmluZWQpIHx8ICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5wYXJlbnROb2RlICE9PSB0YXJnZXQpKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuZmlyc3RDaGlsZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBTa2lwIG5vZGVzIG9mIHVuZGVmaW5lZCBvcmRlcmluZ1xuICAgICAgICB3aGlsZSAoKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkICE9PSBudWxsKSAmJiAodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQuY2xhaW1fb3JkZXIgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkID0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkKSB7XG4gICAgICAgICAgICAvLyBXZSBvbmx5IGluc2VydCBpZiB0aGUgb3JkZXJpbmcgb2YgdGhpcyBub2RlIHNob3VsZCBiZSBtb2RpZmllZCBvciB0aGUgcGFyZW50IG5vZGUgaXMgbm90IHRhcmdldFxuICAgICAgICAgICAgaWYgKG5vZGUuY2xhaW1fb3JkZXIgIT09IHVuZGVmaW5lZCB8fCBub2RlLnBhcmVudE5vZGUgIT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT09IG51bGwpIHtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2h5ZHJhdGlvbih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGlmIChpc19oeWRyYXRpbmcgJiYgIWFuY2hvcikge1xuICAgICAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0IHx8IG5vZGUubmV4dFNpYmxpbmcgIT0gYW5jaG9yKSB7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gY29tbWVudChjb250ZW50KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoY29udGVudCk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX2ltbWVkaWF0ZV9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJ1c3RlZChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQuaXNUcnVzdGVkKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbi8qKlxuICogTGlzdCBvZiBhdHRyaWJ1dGVzIHRoYXQgc2hvdWxkIGFsd2F5cyBiZSBzZXQgdGhyb3VnaCB0aGUgYXR0ciBtZXRob2QsXG4gKiBiZWNhdXNlIHVwZGF0aW5nIHRoZW0gdGhyb3VnaCB0aGUgcHJvcGVydHkgc2V0dGVyIGRvZXNuJ3Qgd29yayByZWxpYWJseS5cbiAqIEluIHRoZSBleGFtcGxlIG9mIGB3aWR0aGAvYGhlaWdodGAsIHRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIHNldHRlciBvbmx5XG4gKiBhY2NlcHRzIG51bWVyaWMgdmFsdWVzLCBidXQgdGhlIGF0dHJpYnV0ZSBjYW4gYWxzbyBiZSBzZXQgdG8gYSBzdHJpbmcgbGlrZSBgNTAlYC5cbiAqIElmIHRoaXMgbGlzdCBiZWNvbWVzIHRvbyBiaWcsIHJldGhpbmsgdGhpcyBhcHByb2FjaC5cbiAqL1xuY29uc3QgYWx3YXlzX3NldF90aHJvdWdoX3NldF9hdHRyaWJ1dGUgPSBbJ3dpZHRoJywgJ2hlaWdodCddO1xuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG5vZGUuX19wcm90b19fKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdfX3ZhbHVlJykge1xuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNjcmlwdG9yc1trZXldICYmIGRlc2NyaXB0b3JzW2tleV0uc2V0ICYmIGFsd2F5c19zZXRfdGhyb3VnaF9zZXRfYXR0cmlidXRlLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhX21hcChub2RlLCBkYXRhX21hcCkge1xuICAgIE9iamVjdC5rZXlzKGRhdGFfbWFwKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwga2V5LCBkYXRhX21hcFtrZXldKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdHlwZW9mIG5vZGVbcHJvcF0gPT09ICdib29sZWFuJyAmJiB2YWx1ZSA9PT0gJycgPyB0cnVlIDogdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfZHluYW1pY19lbGVtZW50X2RhdGEodGFnKSB7XG4gICAgcmV0dXJuICgvLS8udGVzdCh0YWcpKSA/IHNldF9jdXN0b21fZWxlbWVudF9kYXRhX21hcCA6IHNldF9hdHRyaWJ1dGVzO1xufVxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXAsIF9fdmFsdWUsIGNoZWNrZWQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUuYWRkKGdyb3VwW2ldLl9fdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrZWQpIHtcbiAgICAgICAgdmFsdWUuZGVsZXRlKF9fdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh2YWx1ZSk7XG59XG5mdW5jdGlvbiBpbml0X2JpbmRpbmdfZ3JvdXAoZ3JvdXApIHtcbiAgICBsZXQgX2lucHV0cztcbiAgICByZXR1cm4ge1xuICAgICAgICAvKiBwdXNoICovIHAoLi4uaW5wdXRzKSB7XG4gICAgICAgICAgICBfaW5wdXRzID0gaW5wdXRzO1xuICAgICAgICAgICAgX2lucHV0cy5mb3JFYWNoKGlucHV0ID0+IGdyb3VwLnB1c2goaW5wdXQpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyogcmVtb3ZlICovIHIoKSB7XG4gICAgICAgICAgICBfaW5wdXRzLmZvckVhY2goaW5wdXQgPT4gZ3JvdXAuc3BsaWNlKGdyb3VwLmluZGV4T2YoaW5wdXQpLCAxKSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gaW5pdF9iaW5kaW5nX2dyb3VwX2R5bmFtaWMoZ3JvdXAsIGluZGV4ZXMpIHtcbiAgICBsZXQgX2dyb3VwID0gZ2V0X2JpbmRpbmdfZ3JvdXAoZ3JvdXApO1xuICAgIGxldCBfaW5wdXRzO1xuICAgIGZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwKGdyb3VwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZ3JvdXAgPSBncm91cFtpbmRleGVzW2ldXSA9IGdyb3VwW2luZGV4ZXNbaV1dIHx8IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHVzaCgpIHtcbiAgICAgICAgX2lucHV0cy5mb3JFYWNoKGlucHV0ID0+IF9ncm91cC5wdXNoKGlucHV0KSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgICAgX2lucHV0cy5mb3JFYWNoKGlucHV0ID0+IF9ncm91cC5zcGxpY2UoX2dyb3VwLmluZGV4T2YoaW5wdXQpLCAxKSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIC8qIHVwZGF0ZSAqLyB1KG5ld19pbmRleGVzKSB7XG4gICAgICAgICAgICBpbmRleGVzID0gbmV3X2luZGV4ZXM7XG4gICAgICAgICAgICBjb25zdCBuZXdfZ3JvdXAgPSBnZXRfYmluZGluZ19ncm91cChncm91cCk7XG4gICAgICAgICAgICBpZiAobmV3X2dyb3VwICE9PSBfZ3JvdXApIHtcbiAgICAgICAgICAgICAgICByZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBfZ3JvdXAgPSBuZXdfZ3JvdXA7XG4gICAgICAgICAgICAgICAgcHVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvKiBwdXNoICovIHAoLi4uaW5wdXRzKSB7XG4gICAgICAgICAgICBfaW5wdXRzID0gaW5wdXRzO1xuICAgICAgICAgICAgcHVzaCgpO1xuICAgICAgICB9LFxuICAgICAgICAvKiByZW1vdmUgKi8gcjogcmVtb3ZlXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBudWxsIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGluaXRfY2xhaW1faW5mbyhub2Rlcykge1xuICAgIGlmIChub2Rlcy5jbGFpbV9pbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZXMuY2xhaW1faW5mbyA9IHsgbGFzdF9pbmRleDogMCwgdG90YWxfY2xhaW1lZDogMCB9O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsYWltX25vZGUobm9kZXMsIHByZWRpY2F0ZSwgcHJvY2Vzc05vZGUsIGNyZWF0ZU5vZGUsIGRvbnRVcGRhdGVMYXN0SW5kZXggPSBmYWxzZSkge1xuICAgIC8vIFRyeSB0byBmaW5kIG5vZGVzIGluIGFuIG9yZGVyIHN1Y2ggdGhhdCB3ZSBsZW5ndGhlbiB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlXG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCByZXN1bHROb2RlID0gKCgpID0+IHtcbiAgICAgICAgLy8gV2UgZmlyc3QgdHJ5IHRvIGZpbmQgYW4gZWxlbWVudCBhZnRlciB0aGUgcHJldmlvdXMgb25lXG4gICAgICAgIGZvciAobGV0IGkgPSBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXg7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcHJvY2Vzc05vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXNbaV0gPSByZXBsYWNlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkb250VXBkYXRlTGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2UgdHJ5IHRvIGZpbmQgb25lIGJlZm9yZVxuICAgICAgICAvLyBXZSBpdGVyYXRlIGluIHJldmVyc2Ugc28gdGhhdCB3ZSBkb24ndCBnbyB0b28gZmFyIGJhY2tcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBzcGxpY2VkIGJlZm9yZSB0aGUgbGFzdF9pbmRleCwgd2UgZGVjcmVhc2UgaXRcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4LS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIGNhbid0IGZpbmQgYW55IG1hdGNoaW5nIG5vZGUsIHdlIGNyZWF0ZSBhIG5ldyBvbmVcbiAgICAgICAgcmV0dXJuIGNyZWF0ZU5vZGUoKTtcbiAgICB9KSgpO1xuICAgIHJlc3VsdE5vZGUuY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkICs9IDE7XG4gICAgcmV0dXJuIHJlc3VsdE5vZGU7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGNyZWF0ZV9lbGVtZW50KSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVOYW1lID09PSBuYW1lLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCByZW1vdmUgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3ZlLmZvckVhY2godiA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSh2KSk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSwgKCkgPT4gY3JlYXRlX2VsZW1lbnQobmFtZSkpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIGVsZW1lbnQpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3ZnX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fZWxlbWVudF9iYXNlKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmdfZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgcmV0dXJuIGNsYWltX25vZGUobm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSAzLCAobm9kZSkgPT4ge1xuICAgICAgICBjb25zdCBkYXRhU3RyID0gJycgKyBkYXRhO1xuICAgICAgICBpZiAobm9kZS5kYXRhLnN0YXJ0c1dpdGgoZGF0YVN0cikpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmRhdGEubGVuZ3RoICE9PSBkYXRhU3RyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnNwbGl0VGV4dChkYXRhU3RyLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSBkYXRhU3RyO1xuICAgICAgICB9XG4gICAgfSwgKCkgPT4gdGV4dChkYXRhKSwgdHJ1ZSAvLyBUZXh0IG5vZGVzIHNob3VsZCBub3QgdXBkYXRlIGxhc3QgaW5kZXggc2luY2UgaXQgaXMgbGlrZWx5IG5vdCB3b3J0aCBpdCB0byBlbGltaW5hdGUgYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBhY3R1YWwgZWxlbWVudHNcbiAgICApO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbW1lbnQobm9kZXMsIGRhdGEpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IDgsIChub2RlKSA9PiB7XG4gICAgICAgIG5vZGUuZGF0YSA9ICcnICsgZGF0YTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LCAoKSA9PiBjb21tZW50KGRhdGEpLCB0cnVlKTtcbn1cbmZ1bmN0aW9uIGZpbmRfY29tbWVudChub2RlcywgdGV4dCwgc3RhcnQpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIGNvbW1lbnQgbm9kZSAqLyAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGVzLmxlbmd0aDtcbn1cbmZ1bmN0aW9uIGNsYWltX2h0bWxfdGFnKG5vZGVzLCBpc19zdmcpIHtcbiAgICAvLyBmaW5kIGh0bWwgb3BlbmluZyB0YWdcbiAgICBjb25zdCBzdGFydF9pbmRleCA9IGZpbmRfY29tbWVudChub2RlcywgJ0hUTUxfVEFHX1NUQVJUJywgMCk7XG4gICAgY29uc3QgZW5kX2luZGV4ID0gZmluZF9jb21tZW50KG5vZGVzLCAnSFRNTF9UQUdfRU5EJywgc3RhcnRfaW5kZXgpO1xuICAgIGlmIChzdGFydF9pbmRleCA9PT0gZW5kX2luZGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgSHRtbFRhZ0h5ZHJhdGlvbih1bmRlZmluZWQsIGlzX3N2Zyk7XG4gICAgfVxuICAgIGluaXRfY2xhaW1faW5mbyhub2Rlcyk7XG4gICAgY29uc3QgaHRtbF90YWdfbm9kZXMgPSBub2Rlcy5zcGxpY2Uoc3RhcnRfaW5kZXgsIGVuZF9pbmRleCAtIHN0YXJ0X2luZGV4ICsgMSk7XG4gICAgZGV0YWNoKGh0bWxfdGFnX25vZGVzWzBdKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbaHRtbF90YWdfbm9kZXMubGVuZ3RoIC0gMV0pO1xuICAgIGNvbnN0IGNsYWltZWRfbm9kZXMgPSBodG1sX3RhZ19ub2Rlcy5zbGljZSgxLCBodG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxKTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgY2xhaW1lZF9ub2Rlcykge1xuICAgICAgICBuLmNsYWltX29yZGVyID0gbm9kZXMuY2xhaW1faW5mby50b3RhbF9jbGFpbWVkO1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBIdG1sVGFnSHlkcmF0aW9uKGNsYWltZWRfbm9kZXMsIGlzX3N2Zyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2NvbnRlbnRlZGl0YWJsZSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfbWF5YmVfY29udGVudGVkaXRhYmxlKHRleHQsIGRhdGEsIGF0dHJfdmFsdWUpIHtcbiAgICBpZiAofmNvbnRlbnRlZGl0YWJsZV90cnV0aHlfdmFsdWVzLmluZGV4T2YoYXR0cl92YWx1ZSkpIHtcbiAgICAgICAgc2V0X2RhdGFfY29udGVudGVkaXRhYmxlKHRleHQsIGRhdGEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc2V0X2RhdGEodGV4dCwgZGF0YSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2lucHV0X3ZhbHVlKGlucHV0LCB2YWx1ZSkge1xuICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlLCBtb3VudGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFtb3VudGluZyB8fCB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gLTE7IC8vIG5vIG9wdGlvbiBzaG91bGQgYmUgc2VsZWN0ZWRcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbi8vIHVuZm9ydHVuYXRlbHkgdGhpcyBjYW4ndCBiZSBhIGNvbnN0YW50IGFzIHRoYXQgd291bGRuJ3QgYmUgdHJlZS1zaGFrZWFibGVcbi8vIHNvIHdlIGNhY2hlIHRoZSByZXN1bHQgaW5zdGVhZFxubGV0IGNyb3Nzb3JpZ2luO1xuZnVuY3Rpb24gaXNfY3Jvc3NvcmlnaW4oKSB7XG4gICAgaWYgKGNyb3Nzb3JpZ2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY3Jvc3NvcmlnaW4gPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm9pZCB3aW5kb3cucGFyZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY3Jvc3NvcmlnaW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjcm9zc29yaWdpbjtcbn1cbmZ1bmN0aW9uIGFkZF9pZnJhbWVfcmVzaXplX2xpc3RlbmVyKG5vZGUsIGZuKSB7XG4gICAgY29uc3QgY29tcHV0ZWRfc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChjb21wdXRlZF9zdHlsZS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgfVxuICAgIGNvbnN0IGlmcmFtZSA9IGVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgJyArXG4gICAgICAgICdvdmVyZmxvdzogaGlkZGVuOyBib3JkZXI6IDA7IG9wYWNpdHk6IDA7IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBpc19jcm9zc29yaWdpbigpO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9IFwiZGF0YTp0ZXh0L2h0bWwsPHNjcmlwdD5vbnJlc2l6ZT1mdW5jdGlvbigpe3BhcmVudC5wb3N0TWVzc2FnZSgwLCcqJyl9PC9zY3JpcHQ+XCI7XG4gICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKHdpbmRvdywgJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGlmcmFtZS5jb250ZW50V2luZG93KVxuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGlmcmFtZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3RlbihpZnJhbWUuY29udGVudFdpbmRvdywgJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBhbiBpbml0aWFsIHJlc2l6ZSBldmVudCBpcyBmaXJlZCBfYWZ0ZXJfIHRoZSBpZnJhbWUgaXMgbG9hZGVkICh3aGljaCBpcyBhc3luY2hyb25vdXMpXG4gICAgICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9pc3N1ZXMvNDIzM1xuICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXBwZW5kKG5vZGUsIGlmcmFtZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVuc3Vic2NyaWJlICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRldGFjaChpZnJhbWUpO1xuICAgIH07XG59XG5jb25zdCByZXNpemVfb2JzZXJ2ZXJfY29udGVudF9ib3ggPSAvKiBAX19QVVJFX18gKi8gbmV3IFJlc2l6ZU9ic2VydmVyU2luZ2xldG9uKHsgYm94OiAnY29udGVudC1ib3gnIH0pO1xuY29uc3QgcmVzaXplX29ic2VydmVyX2JvcmRlcl9ib3ggPSAvKiBAX19QVVJFX18gKi8gbmV3IFJlc2l6ZU9ic2VydmVyU2luZ2xldG9uKHsgYm94OiAnYm9yZGVyLWJveCcgfSk7XG5jb25zdCByZXNpemVfb2JzZXJ2ZXJfZGV2aWNlX3BpeGVsX2NvbnRlbnRfYm94ID0gLyogQF9fUFVSRV9fICovIG5ldyBSZXNpemVPYnNlcnZlclNpbmdsZXRvbih7IGJveDogJ2RldmljZS1waXhlbC1jb250ZW50LWJveCcgfSk7XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsLCB7IGJ1YmJsZXMgPSBmYWxzZSwgY2FuY2VsYWJsZSA9IGZhbHNlIH0gPSB7fSkge1xuICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBidWJibGVzLCBjYW5jZWxhYmxlLCBkZXRhaWwpO1xuICAgIHJldHVybiBlO1xufVxuZnVuY3Rpb24gcXVlcnlfc2VsZWN0b3JfYWxsKHNlbGVjdG9yLCBwYXJlbnQgPSBkb2N1bWVudC5ib2R5KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbn1cbmZ1bmN0aW9uIGhlYWRfc2VsZWN0b3Iobm9kZUlkLCBoZWFkKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgbGV0IHN0YXJ0ZWQgPSAwO1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBoZWFkLmNoaWxkTm9kZXMpIHtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDggLyogY29tbWVudCBub2RlICovKSB7XG4gICAgICAgICAgICBjb25zdCBjb21tZW50ID0gbm9kZS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICAgICAgICBpZiAoY29tbWVudCA9PT0gYEhFQURfJHtub2RlSWR9X0VORGApIHtcbiAgICAgICAgICAgICAgICBzdGFydGVkIC09IDE7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb21tZW50ID09PSBgSEVBRF8ke25vZGVJZH1fU1RBUlRgKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRlZCArPSAxO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHN0YXJ0ZWQgPiAwKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuY2xhc3MgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoaXNfc3ZnID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5pc19zdmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc19zdmcgPSBpc19zdmc7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMubiA9IG51bGw7XG4gICAgfVxuICAgIGMoaHRtbCkge1xuICAgICAgICB0aGlzLmgoaHRtbCk7XG4gICAgfVxuICAgIG0oaHRtbCwgdGFyZ2V0LCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5lKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc19zdmcpXG4gICAgICAgICAgICAgICAgdGhpcy5lID0gc3ZnX2VsZW1lbnQodGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICAgICAgICAgIC8qKiAjNzM2NCAgdGFyZ2V0IGZvciA8dGVtcGxhdGU+IG1heSBiZSBwcm92aWRlZCBhcyAjZG9jdW1lbnQtZnJhZ21lbnQoMTEpICovXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5lID0gZWxlbWVudCgodGFyZ2V0Lm5vZGVUeXBlID09PSAxMSA/ICdURU1QTEFURScgOiB0YXJnZXQubm9kZU5hbWUpKTtcbiAgICAgICAgICAgIHRoaXMudCA9IHRhcmdldC50YWdOYW1lICE9PSAnVEVNUExBVEUnID8gdGFyZ2V0IDogdGFyZ2V0LmNvbnRlbnQ7XG4gICAgICAgICAgICB0aGlzLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pKGFuY2hvcik7XG4gICAgfVxuICAgIGgoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUubm9kZU5hbWUgPT09ICdURU1QTEFURScgPyB0aGlzLmUuY29udGVudC5jaGlsZE5vZGVzIDogdGhpcy5lLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgICAgICB0aGlzLmkodGhpcy5hKTtcbiAgICB9XG4gICAgZCgpIHtcbiAgICAgICAgdGhpcy5uLmZvckVhY2goZGV0YWNoKTtcbiAgICB9XG59XG5jbGFzcyBIdG1sVGFnSHlkcmF0aW9uIGV4dGVuZHMgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoY2xhaW1lZF9ub2RlcywgaXNfc3ZnID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIoaXNfc3ZnKTtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICAgICAgdGhpcy5sID0gY2xhaW1lZF9ub2RlcztcbiAgICB9XG4gICAgYyhodG1sKSB7XG4gICAgICAgIGlmICh0aGlzLmwpIHtcbiAgICAgICAgICAgIHRoaXMubiA9IHRoaXMubDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydF9oeWRyYXRpb24odGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhdHRyaWJ1dGVfdG9fb2JqZWN0KGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJlc3VsdFthdHRyaWJ1dGUubmFtZV0gPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzKGVsZW1lbnQpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICByZXN1bHRbbm9kZS5zbG90IHx8ICdkZWZhdWx0J10gPSB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb25zdHJ1Y3Rfc3ZlbHRlX2NvbXBvbmVudChjb21wb25lbnQsIHByb3BzKSB7XG4gICAgcmV0dXJuIG5ldyBjb21wb25lbnQocHJvcHMpO1xufVxuXG4vLyB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBpbmZvcm1hdGlvbiBmb3IgbXVsdGlwbGUgZG9jdW1lbnRzIGJlY2F1c2UgYSBTdmVsdGUgYXBwbGljYXRpb24gY291bGQgYWxzbyBjb250YWluIGlmcmFtZXNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvaXNzdWVzLzM2MjRcbmNvbnN0IG1hbmFnZWRfc3R5bGVzID0gbmV3IE1hcCgpO1xubGV0IGFjdGl2ZSA9IDA7XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3N0eWxlX2luZm9ybWF0aW9uKGRvYywgbm9kZSkge1xuICAgIGNvbnN0IGluZm8gPSB7IHN0eWxlc2hlZXQ6IGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0KG5vZGUpLCBydWxlczoge30gfTtcbiAgICBtYW5hZ2VkX3N0eWxlcy5zZXQoZG9jLCBpbmZvKTtcbiAgICByZXR1cm4gaW5mbztcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpO1xuICAgIGNvbnN0IHsgc3R5bGVzaGVldCwgcnVsZXMgfSA9IG1hbmFnZWRfc3R5bGVzLmdldChkb2MpIHx8IGNyZWF0ZV9zdHlsZV9pbmZvcm1hdGlvbihkb2MsIG5vZGUpO1xuICAgIGlmICghcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiAnJ30ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJykuc3BsaXQoJywgJyk7XG4gICAgY29uc3QgbmV4dCA9IHByZXZpb3VzLmZpbHRlcihuYW1lXG4gICAgICAgID8gYW5pbSA9PiBhbmltLmluZGV4T2YobmFtZSkgPCAwIC8vIHJlbW92ZSBzcGVjaWZpYyBhbmltYXRpb25cbiAgICAgICAgOiBhbmltID0+IGFuaW0uaW5kZXhPZignX19zdmVsdGUnKSA9PT0gLTEgLy8gcmVtb3ZlIGFsbCBTdmVsdGUgYW5pbWF0aW9uc1xuICAgICk7XG4gICAgY29uc3QgZGVsZXRlZCA9IHByZXZpb3VzLmxlbmd0aCAtIG5leHQubGVuZ3RoO1xuICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gbmV4dC5qb2luKCcsICcpO1xuICAgICAgICBhY3RpdmUgLT0gZGVsZXRlZDtcbiAgICAgICAgaWYgKCFhY3RpdmUpXG4gICAgICAgICAgICBjbGVhcl9ydWxlcygpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG1hbmFnZWRfc3R5bGVzLmZvckVhY2goaW5mbyA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IG93bmVyTm9kZSB9ID0gaW5mby5zdHlsZXNoZWV0O1xuICAgICAgICAgICAgLy8gdGhlcmUgaXMgbm8gb3duZXJOb2RlIGlmIGl0IHJ1bnMgb24ganNkb20uXG4gICAgICAgICAgICBpZiAob3duZXJOb2RlKVxuICAgICAgICAgICAgICAgIGRldGFjaChvd25lck5vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbWFuYWdlZF9zdHlsZXMuY2xlYXIoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbicpO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbi8qKlxuICogU2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gcnVuIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIHVwZGF0ZWQgYWZ0ZXIgYW55IHN0YXRlIGNoYW5nZS5cbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgcnVucyB3aWxsIGJlIGJlZm9yZSB0aGUgaW5pdGlhbCBgb25Nb3VudGBcbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtYmVmb3JldXBkYXRlXG4gKi9cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG4vKipcbiAqIFRoZSBgb25Nb3VudGAgZnVuY3Rpb24gc2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gcnVuIGFzIHNvb24gYXMgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBtb3VudGVkIHRvIHRoZSBET00uXG4gKiBJdCBtdXN0IGJlIGNhbGxlZCBkdXJpbmcgdGhlIGNvbXBvbmVudCdzIGluaXRpYWxpc2F0aW9uIChidXQgZG9lc24ndCBuZWVkIHRvIGxpdmUgKmluc2lkZSogdGhlIGNvbXBvbmVudDtcbiAqIGl0IGNhbiBiZSBjYWxsZWQgZnJvbSBhbiBleHRlcm5hbCBtb2R1bGUpLlxuICpcbiAqIGBvbk1vdW50YCBkb2VzIG5vdCBydW4gaW5zaWRlIGEgW3NlcnZlci1zaWRlIGNvbXBvbmVudF0oL2RvY3MjcnVuLXRpbWUtc2VydmVyLXNpZGUtY29tcG9uZW50LWFwaSkuXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3MjcnVuLXRpbWUtc3ZlbHRlLW9ubW91bnRcbiAqL1xuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuLyoqXG4gKiBTY2hlZHVsZXMgYSBjYWxsYmFjayB0byBydW4gaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiB1cGRhdGVkLlxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBydW5zIHdpbGwgYmUgYWZ0ZXIgdGhlIGluaXRpYWwgYG9uTW91bnRgXG4gKi9cbmZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfdXBkYXRlLnB1c2goZm4pO1xufVxuLyoqXG4gKiBTY2hlZHVsZXMgYSBjYWxsYmFjayB0byBydW4gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgdW5tb3VudGVkLlxuICpcbiAqIE91dCBvZiBgb25Nb3VudGAsIGBiZWZvcmVVcGRhdGVgLCBgYWZ0ZXJVcGRhdGVgIGFuZCBgb25EZXN0cm95YCwgdGhpcyBpcyB0aGVcbiAqIG9ubHkgb25lIHRoYXQgcnVucyBpbnNpZGUgYSBzZXJ2ZXItc2lkZSBjb21wb25lbnQuXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3MjcnVuLXRpbWUtc3ZlbHRlLW9uZGVzdHJveVxuICovXG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuLyoqXG4gKiBDcmVhdGVzIGFuIGV2ZW50IGRpc3BhdGNoZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBkaXNwYXRjaCBbY29tcG9uZW50IGV2ZW50c10oL2RvY3MjdGVtcGxhdGUtc3ludGF4LWNvbXBvbmVudC1kaXJlY3RpdmVzLW9uLWV2ZW50bmFtZSkuXG4gKiBFdmVudCBkaXNwYXRjaGVycyBhcmUgZnVuY3Rpb25zIHRoYXQgY2FuIHRha2UgdHdvIGFyZ3VtZW50czogYG5hbWVgIGFuZCBgZGV0YWlsYC5cbiAqXG4gKiBDb21wb25lbnQgZXZlbnRzIGNyZWF0ZWQgd2l0aCBgY3JlYXRlRXZlbnREaXNwYXRjaGVyYCBjcmVhdGUgYVxuICogW0N1c3RvbUV2ZW50XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQpLlxuICogVGhlc2UgZXZlbnRzIGRvIG5vdCBbYnViYmxlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0xlYXJuL0phdmFTY3JpcHQvQnVpbGRpbmdfYmxvY2tzL0V2ZW50cyNFdmVudF9idWJibGluZ19hbmRfY2FwdHVyZSkuXG4gKiBUaGUgYGRldGFpbGAgYXJndW1lbnQgY29ycmVzcG9uZHMgdG8gdGhlIFtDdXN0b21FdmVudC5kZXRhaWxdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FdmVudC9kZXRhaWwpXG4gKiBwcm9wZXJ0eSBhbmQgY2FuIGNvbnRhaW4gYW55IHR5cGUgb2YgZGF0YS5cbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtY3JlYXRlZXZlbnRkaXNwYXRjaGVyXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCwgeyBjYW5jZWxhYmxlID0gZmFsc2UgfSA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCwgeyBjYW5jZWxhYmxlIH0pO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICFldmVudC5kZWZhdWx0UHJldmVudGVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG59XG4vKipcbiAqIEFzc29jaWF0ZXMgYW4gYXJiaXRyYXJ5IGBjb250ZXh0YCBvYmplY3Qgd2l0aCB0aGUgY3VycmVudCBjb21wb25lbnQgYW5kIHRoZSBzcGVjaWZpZWQgYGtleWBcbiAqIGFuZCByZXR1cm5zIHRoYXQgb2JqZWN0LiBUaGUgY29udGV4dCBpcyB0aGVuIGF2YWlsYWJsZSB0byBjaGlsZHJlbiBvZiB0aGUgY29tcG9uZW50XG4gKiAoaW5jbHVkaW5nIHNsb3R0ZWQgY29udGVudCkgd2l0aCBgZ2V0Q29udGV4dGAuXG4gKlxuICogTGlrZSBsaWZlY3ljbGUgZnVuY3Rpb25zLCB0aGlzIG11c3QgYmUgY2FsbGVkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24uXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3MjcnVuLXRpbWUtc3ZlbHRlLXNldGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0O1xufVxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGNvbnRleHQgdGhhdCBiZWxvbmdzIHRvIHRoZSBjbG9zZXN0IHBhcmVudCBjb21wb25lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIGBrZXlgLlxuICogTXVzdCBiZSBjYWxsZWQgZHVyaW5nIGNvbXBvbmVudCBpbml0aWFsaXNhdGlvbi5cbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtZ2V0Y29udGV4dFxuICovXG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHdob2xlIGNvbnRleHQgbWFwIHRoYXQgYmVsb25ncyB0byB0aGUgY2xvc2VzdCBwYXJlbnQgY29tcG9uZW50LlxuICogTXVzdCBiZSBjYWxsZWQgZHVyaW5nIGNvbXBvbmVudCBpbml0aWFsaXNhdGlvbi4gVXNlZnVsLCBmb3IgZXhhbXBsZSwgaWYgeW91XG4gKiBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZSBhIGNvbXBvbmVudCBhbmQgd2FudCB0byBwYXNzIHRoZSBleGlzdGluZyBjb250ZXh0IHRvIGl0LlxuICpcbiAqIGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzI3J1bi10aW1lLXN2ZWx0ZS1nZXRhbGxjb250ZXh0c1xuICovXG5mdW5jdGlvbiBnZXRBbGxDb250ZXh0cygpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dDtcbn1cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBga2V5YCBoYXMgYmVlbiBzZXQgaW4gdGhlIGNvbnRleHQgb2YgYSBwYXJlbnQgY29tcG9uZW50LlxuICogTXVzdCBiZSBjYWxsZWQgZHVyaW5nIGNvbXBvbmVudCBpbml0aWFsaXNhdGlvbi5cbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtaGFzY29udGV4dFxuICovXG5mdW5jdGlvbiBoYXNDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmhhcyhrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiBmbi5jYWxsKHRoaXMsIGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xubGV0IHJlbmRlcl9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IGZsdXNoX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IC8qIEBfX1BVUkVfXyAqLyBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbi8vIGZsdXNoKCkgY2FsbHMgY2FsbGJhY2tzIGluIHRoaXMgb3JkZXI6XG4vLyAxLiBBbGwgYmVmb3JlVXBkYXRlIGNhbGxiYWNrcywgaW4gb3JkZXI6IHBhcmVudHMgYmVmb3JlIGNoaWxkcmVuXG4vLyAyLiBBbGwgYmluZDp0aGlzIGNhbGxiYWNrcywgaW4gcmV2ZXJzZSBvcmRlcjogY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMuXG4vLyAzLiBBbGwgYWZ0ZXJVcGRhdGUgY2FsbGJhY2tzLCBpbiBvcmRlcjogcGFyZW50cyBiZWZvcmUgY2hpbGRyZW4uIEVYQ0VQVFxuLy8gICAgZm9yIGFmdGVyVXBkYXRlcyBjYWxsZWQgZHVyaW5nIHRoZSBpbml0aWFsIG9uTW91bnQsIHdoaWNoIGFyZSBjYWxsZWQgaW5cbi8vICAgIHJldmVyc2Ugb3JkZXI6IGNoaWxkcmVuIGJlZm9yZSBwYXJlbnRzLlxuLy8gU2luY2UgY2FsbGJhY2tzIG1pZ2h0IHVwZGF0ZSBjb21wb25lbnQgdmFsdWVzLCB3aGljaCBjb3VsZCB0cmlnZ2VyIGFub3RoZXJcbi8vIGNhbGwgdG8gZmx1c2goKSwgdGhlIGZvbGxvd2luZyBzdGVwcyBndWFyZCBhZ2FpbnN0IHRoaXM6XG4vLyAxLiBEdXJpbmcgYmVmb3JlVXBkYXRlLCBhbnkgdXBkYXRlZCBjb21wb25lbnRzIHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4vLyAgICBkaXJ0eV9jb21wb25lbnRzIGFycmF5IGFuZCB3aWxsIGNhdXNlIGEgcmVlbnRyYW50IGNhbGwgdG8gZmx1c2goKS4gQmVjYXVzZVxuLy8gICAgdGhlIGZsdXNoIGluZGV4IGlzIGtlcHQgb3V0c2lkZSB0aGUgZnVuY3Rpb24sIHRoZSByZWVudHJhbnQgY2FsbCB3aWxsIHBpY2tcbi8vICAgIHVwIHdoZXJlIHRoZSBlYXJsaWVyIGNhbGwgbGVmdCBvZmYgYW5kIGdvIHRocm91Z2ggYWxsIGRpcnR5IGNvbXBvbmVudHMuIFRoZVxuLy8gICAgY3VycmVudF9jb21wb25lbnQgdmFsdWUgaXMgc2F2ZWQgYW5kIHJlc3RvcmVkIHNvIHRoYXQgdGhlIHJlZW50cmFudCBjYWxsIHdpbGxcbi8vICAgIG5vdCBpbnRlcmZlcmUgd2l0aCB0aGUgXCJwYXJlbnRcIiBmbHVzaCgpIGNhbGwuXG4vLyAyLiBiaW5kOnRoaXMgY2FsbGJhY2tzIGNhbm5vdCB0cmlnZ2VyIG5ldyBmbHVzaCgpIGNhbGxzLlxuLy8gMy4gRHVyaW5nIGFmdGVyVXBkYXRlLCBhbnkgdXBkYXRlZCBjb21wb25lbnRzIHdpbGwgTk9UIGhhdmUgdGhlaXIgYWZ0ZXJVcGRhdGVcbi8vICAgIGNhbGxiYWNrIGNhbGxlZCBhIHNlY29uZCB0aW1lOyB0aGUgc2Vlbl9jYWxsYmFja3Mgc2V0LCBvdXRzaWRlIHRoZSBmbHVzaCgpXG4vLyAgICBmdW5jdGlvbiwgZ3VhcmFudGVlcyB0aGlzIGJlaGF2aW9yLlxuY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5sZXQgZmx1c2hpZHggPSAwOyAvLyBEbyAqbm90KiBtb3ZlIHRoaXMgaW5zaWRlIHRoZSBmbHVzaCgpIGZ1bmN0aW9uXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAvLyBEbyBub3QgcmVlbnRlciBmbHVzaCB3aGlsZSBkaXJ0eSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBhcyB0aGlzIGNhblxuICAgIC8vIHJlc3VsdCBpbiBhbiBpbmZpbml0ZSBsb29wLiBJbnN0ZWFkLCBsZXQgdGhlIGlubmVyIGZsdXNoIGhhbmRsZSBpdC5cbiAgICAvLyBSZWVudHJhbmN5IGlzIG9rIGFmdGVyd2FyZHMgZm9yIGJpbmRpbmdzIGV0Yy5cbiAgICBpZiAoZmx1c2hpZHggIT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzYXZlZF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBkbyB7XG4gICAgICAgIC8vIGZpcnN0LCBjYWxsIGJlZm9yZVVwZGF0ZSBmdW5jdGlvbnNcbiAgICAgICAgLy8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB3aGlsZSAoZmx1c2hpZHggPCBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbZmx1c2hpZHhdO1xuICAgICAgICAgICAgICAgIGZsdXNoaWR4Kys7XG4gICAgICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgdXBkYXRlKGNvbXBvbmVudC4kJCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHJlc2V0IGRpcnR5IHN0YXRlIHRvIG5vdCBlbmQgdXAgaW4gYSBkZWFkbG9ja2VkIHN0YXRlIGFuZCB0aGVuIHJldGhyb3dcbiAgICAgICAgICAgIGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGZsdXNoaWR4ID0gMDtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIGZsdXNoaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHNlZW5fY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHNhdmVkX2NvbXBvbmVudCk7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuLyoqXG4gKiBVc2VmdWwgZm9yIGV4YW1wbGUgdG8gZXhlY3V0ZSByZW1haW5pbmcgYGFmdGVyVXBkYXRlYCBjYWxsYmFja3MgYmVmb3JlIGV4ZWN1dGluZyBgZGVzdHJveWAuXG4gKi9cbmZ1bmN0aW9uIGZsdXNoX3JlbmRlcl9jYWxsYmFja3MoZm5zKSB7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBbXTtcbiAgICBjb25zdCB0YXJnZXRzID0gW107XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5mb3JFYWNoKChjKSA9PiBmbnMuaW5kZXhPZihjKSA9PT0gLTEgPyBmaWx0ZXJlZC5wdXNoKGMpIDogdGFyZ2V0cy5wdXNoKGMpKTtcbiAgICB0YXJnZXRzLmZvckVhY2goKGMpID0+IGMoKSk7XG4gICAgcmVuZGVyX2NhbGxiYWNrcyA9IGZpbHRlcmVkO1xufVxuXG5sZXQgcHJvbWlzZTtcbmZ1bmN0aW9uIHdhaXQoKSB7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBkaXNwYXRjaChub2RlLCBkaXJlY3Rpb24sIGtpbmQpIHtcbiAgICBub2RlLmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KGAke2RpcmVjdGlvbiA/ICdpbnRybycgOiAnb3V0cm8nfSR7a2luZH1gKSk7XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG59XG5jb25zdCBudWxsX3RyYW5zaXRpb24gPSB7IGR1cmF0aW9uOiAwIH07XG5mdW5jdGlvbiBjcmVhdGVfaW5fdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHsgZGlyZWN0aW9uOiAnaW4nIH07XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgbGV0IHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHVpZCA9IDA7XG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcywgdWlkKyspO1xuICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGlmICh0YXNrKVxuICAgICAgICAgICAgdGFzay5hYm9ydCgpO1xuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCB0cnVlLCAnc3RhcnQnKSk7XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKGdvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfb3V0X3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7IGRpcmVjdGlvbjogJ291dCcgfTtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zLCBvcHRpb25zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKG9wdGlvbnMpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7IGRpcmVjdGlvbjogJ2JvdGgnIH07XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IChwcm9ncmFtLmIgLSB0KTtcbiAgICAgICAgZHVyYXRpb24gKj0gTWF0aC5hYnMoZCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhOiB0LFxuICAgICAgICAgICAgYjogcHJvZ3JhbS5iLFxuICAgICAgICAgICAgZCxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgc3RhcnQ6IHByb2dyYW0uc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IHByb2dyYW0uc3RhcnQgKyBkdXJhdGlvbixcbiAgICAgICAgICAgIGdyb3VwOiBwcm9ncmFtLmdyb3VwXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKGIpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgY29uc3QgcHJvZ3JhbSA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiBub3coKSArIGRlbGF5LFxuICAgICAgICAgICAgYlxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBwcm9ncmFtLmdyb3VwID0gb3V0cm9zO1xuICAgICAgICAgICAgb3V0cm9zLnIgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYW4gaW50cm8sIGFuZCB0aGVyZSdzIGEgZGVsYXksIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFuIGluaXRpYWwgdGljayBhbmQvb3IgYXBwbHkgQ1NTIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYilcbiAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGIsICdzdGFydCcpKTtcbiAgICAgICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGVuZGluZ19wcm9ncmFtICYmIG5vdyA+IHBlbmRpbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHBlbmRpbmdfcHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ3N0YXJ0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBydW5uaW5nX3Byb2dyYW0uYiwgcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uLCAwLCBlYXNpbmcsIGNvbmZpZy5jc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQgPSBydW5uaW5nX3Byb2dyYW0uYiwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0uYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRybyDigJQgd2UgY2FuIHRpZHkgdXAgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvdXRybyDigJQgbmVlZHMgdG8gYmUgY29vcmRpbmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEtLXJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChydW5uaW5nX3Byb2dyYW0uZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gbm93IC0gcnVubmluZ19wcm9ncmFtLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IHJ1bm5pbmdfcHJvZ3JhbS5hICsgcnVubmluZ19wcm9ncmFtLmQgKiBlYXNpbmcocCAvIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gISEocnVubmluZ19wcm9ncmFtIHx8IHBlbmRpbmdfcHJvZ3JhbSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBydW4oYikge1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5ibG9ja3NbaV0gPT09IGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uYmxvY2tzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgIGlmICghaW5mby5oYXNDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2goaW5mbywgY3R4LCBkaXJ0eSkge1xuICAgIGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuICAgIGNvbnN0IHsgcmVzb2x2ZWQgfSA9IGluZm87XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby50aGVuKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLnZhbHVlXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpZiAoaW5mby5jdXJyZW50ID09PSBpbmZvLmNhdGNoKSB7XG4gICAgICAgIGNoaWxkX2N0eFtpbmZvLmVycm9yXSA9IHJlc29sdmVkO1xuICAgIH1cbiAgICBpbmZvLmJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCB1cGRhdGVzID0gW107XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgLy8gZGVmZXIgdXBkYXRlcyB1bnRpbCBhbGwgdGhlIERPTSBzaHVmZmxpbmcgaXMgZG9uZVxuICAgICAgICAgICAgdXBkYXRlcy5wdXNoKCgpID0+IGJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcnVuX2FsbCh1cGRhdGVzKTtcbiAgICByZXR1cm4gbmV3X2Jsb2Nrcztcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfa2V5cyhjdHgsIGxpc3QsIGdldF9jb250ZXh0LCBnZXRfa2V5KSB7XG4gICAgY29uc3Qga2V5cyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpKTtcbiAgICAgICAgaWYgKGtleXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGhhdmUgZHVwbGljYXRlIGtleXMgaW4gYSBrZXllZCBlYWNoJyk7XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5hZGQoa2V5KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldF9zcHJlYWRfdXBkYXRlKGxldmVscywgdXBkYXRlcykge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHt9O1xuICAgIGNvbnN0IHRvX251bGxfb3V0ID0ge307XG4gICAgY29uc3QgYWNjb3VudGVkX2ZvciA9IHsgJCRzY29wZTogMSB9O1xuICAgIGxldCBpID0gbGV2ZWxzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IG8gPSBsZXZlbHNbaV07XG4gICAgICAgIGNvbnN0IG4gPSB1cGRhdGVzW2ldO1xuICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiBuKSlcbiAgICAgICAgICAgICAgICAgICAgdG9fbnVsbF9vdXRba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBuKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhY2NvdW50ZWRfZm9yW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlW2tleV0gPSBuW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV2ZWxzW2ldID0gbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIHRvX251bGxfb3V0KSB7XG4gICAgICAgIGlmICghKGtleSBpbiB1cGRhdGUpKVxuICAgICAgICAgICAgdXBkYXRlW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1cGRhdGU7XG59XG5mdW5jdGlvbiBnZXRfc3ByZWFkX29iamVjdChzcHJlYWRfcHJvcHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHNwcmVhZF9wcm9wcyA9PT0gJ29iamVjdCcgJiYgc3ByZWFkX3Byb3BzICE9PSBudWxsID8gc3ByZWFkX3Byb3BzIDoge307XG59XG5cbmNvbnN0IF9ib29sZWFuX2F0dHJpYnV0ZXMgPSBbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2luZXJ0JyxcbiAgICAnaXNtYXAnLFxuICAgICdsb29wJyxcbiAgICAnbXVsdGlwbGUnLFxuICAgICdtdXRlZCcsXG4gICAgJ25vbW9kdWxlJyxcbiAgICAnbm92YWxpZGF0ZScsXG4gICAgJ29wZW4nLFxuICAgICdwbGF5c2lubGluZScsXG4gICAgJ3JlYWRvbmx5JyxcbiAgICAncmVxdWlyZWQnLFxuICAgICdyZXZlcnNlZCcsXG4gICAgJ3NlbGVjdGVkJ1xuXTtcbi8qKlxuICogTGlzdCBvZiBIVE1MIGJvb2xlYW4gYXR0cmlidXRlcyAoZS5nLiBgPGlucHV0IGRpc2FibGVkPmApLlxuICogU291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbiAqL1xuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbLi4uX2Jvb2xlYW5fYXR0cmlidXRlc10pO1xuXG4vKiogcmVnZXggb2YgYWxsIGh0bWwgdm9pZCBlbGVtZW50IG5hbWVzICovXG5jb25zdCB2b2lkX2VsZW1lbnRfbmFtZXMgPSAvXig/OmFyZWF8YmFzZXxicnxjb2x8Y29tbWFuZHxlbWJlZHxocnxpbWd8aW5wdXR8a2V5Z2VufGxpbmt8bWV0YXxwYXJhbXxzb3VyY2V8dHJhY2t8d2JyKSQvO1xuZnVuY3Rpb24gaXNfdm9pZChuYW1lKSB7XG4gICAgcmV0dXJuIHZvaWRfZWxlbWVudF9uYW1lcy50ZXN0KG5hbWUpIHx8IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJyFkb2N0eXBlJztcbn1cblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgYXR0cnNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChhdHRyc190b19hZGQpIHtcbiAgICAgICAgY29uc3QgY2xhc3Nlc190b19hZGQgPSBhdHRyc190b19hZGQuY2xhc3NlcztcbiAgICAgICAgY29uc3Qgc3R5bGVzX3RvX2FkZCA9IGF0dHJzX3RvX2FkZC5zdHlsZXM7XG4gICAgICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0eWxlc190b19hZGQpIHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLnN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnN0eWxlID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZXNfdG9fYWRkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuc3R5bGUgPSBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKG1lcmdlX3Nzcl9zdHlsZXMoYXR0cmlidXRlcy5zdHlsZSwgc3R5bGVzX3RvX2FkZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IGAgJHtuYW1lfT1cIiR7dmFsdWV9XCJgO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmZ1bmN0aW9uIG1lcmdlX3Nzcl9zdHlsZXMoc3R5bGVfYXR0cmlidXRlLCBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICBjb25zdCBzdHlsZV9vYmplY3QgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGluZGl2aWR1YWxfc3R5bGUgb2Ygc3R5bGVfYXR0cmlidXRlLnNwbGl0KCc7JykpIHtcbiAgICAgICAgY29uc3QgY29sb25faW5kZXggPSBpbmRpdmlkdWFsX3N0eWxlLmluZGV4T2YoJzonKTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGluZGl2aWR1YWxfc3R5bGUuc2xpY2UoMCwgY29sb25faW5kZXgpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbmRpdmlkdWFsX3N0eWxlLnNsaWNlKGNvbG9uX2luZGV4ICsgMSkudHJpbSgpO1xuICAgICAgICBpZiAoIW5hbWUpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAoY29uc3QgbmFtZSBpbiBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZV9kaXJlY3RpdmVbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgc3R5bGVfb2JqZWN0W25hbWVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZV9vYmplY3Q7XG59XG5jb25zdCBBVFRSX1JFR0VYID0gL1smXCJdL2c7XG5jb25zdCBDT05URU5UX1JFR0VYID0gL1smPF0vZztcbi8qKlxuICogTm90ZTogdGhpcyBtZXRob2QgaXMgcGVyZm9ybWFuY2Ugc2Vuc2l0aXZlIGFuZCBoYXMgYmVlbiBvcHRpbWl6ZWRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvcHVsbC81NzAxXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZSh2YWx1ZSwgaXNfYXR0ciA9IGZhbHNlKSB7XG4gICAgY29uc3Qgc3RyID0gU3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBwYXR0ZXJuID0gaXNfYXR0ciA/IEFUVFJfUkVHRVggOiBDT05URU5UX1JFR0VYO1xuICAgIHBhdHRlcm4ubGFzdEluZGV4ID0gMDtcbiAgICBsZXQgZXNjYXBlZCA9ICcnO1xuICAgIGxldCBsYXN0ID0gMDtcbiAgICB3aGlsZSAocGF0dGVybi50ZXN0KHN0cikpIHtcbiAgICAgICAgY29uc3QgaSA9IHBhdHRlcm4ubGFzdEluZGV4IC0gMTtcbiAgICAgICAgY29uc3QgY2ggPSBzdHJbaV07XG4gICAgICAgIGVzY2FwZWQgKz0gc3RyLnN1YnN0cmluZyhsYXN0LCBpKSArIChjaCA9PT0gJyYnID8gJyZhbXA7JyA6IChjaCA9PT0gJ1wiJyA/ICcmcXVvdDsnIDogJyZsdDsnKSk7XG4gICAgICAgIGxhc3QgPSBpICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGVzY2FwZWQgKyBzdHIuc3Vic3RyaW5nKGxhc3QpO1xufVxuZnVuY3Rpb24gZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSh2YWx1ZSkge1xuICAgIC8vIGtlZXAgYm9vbGVhbnMsIG51bGwsIGFuZCB1bmRlZmluZWQgZm9yIHRoZSBzYWtlIG9mIGBzcHJlYWRgXG4gICAgY29uc3Qgc2hvdWxkX2VzY2FwZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpO1xuICAgIHJldHVybiBzaG91bGRfZXNjYXBlID8gZXNjYXBlKHZhbHVlLCB0cnVlKSA6IHZhbHVlO1xufVxuZnVuY3Rpb24gZXNjYXBlX29iamVjdChvYmopIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXMuIE90aGVyd2lzZSB5b3UgbWF5IG5lZWQgdG8gZml4IGEgPCR7bmFtZX0+LmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cywgY29udGV4dCkge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAoY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIHsgJCRzbG90cyA9IHt9LCBjb250ZXh0ID0gbmV3IE1hcCgpIH0gPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyB0aXRsZTogJycsIGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCAkJHNsb3RzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQudGl0bGUgKyByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICBjb25zdCBhc3NpZ25tZW50ID0gKGJvb2xlYW4gJiYgdmFsdWUgPT09IHRydWUpID8gJycgOiBgPVwiJHtlc2NhcGUodmFsdWUsIHRydWUpfVwiYDtcbiAgICByZXR1cm4gYCAke25hbWV9JHthc3NpZ25tZW50fWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6ICcnO1xufVxuZnVuY3Rpb24gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZV9vYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoc3R5bGVfb2JqZWN0KVxuICAgICAgICAuZmlsdGVyKGtleSA9PiBzdHlsZV9vYmplY3Rba2V5XSlcbiAgICAgICAgLm1hcChrZXkgPT4gYCR7a2V5fTogJHtlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKHN0eWxlX29iamVjdFtrZXldKX07YClcbiAgICAgICAgLmpvaW4oJyAnKTtcbn1cbmZ1bmN0aW9uIGFkZF9zdHlsZXMoc3R5bGVfb2JqZWN0KSB7XG4gICAgY29uc3Qgc3R5bGVzID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZV9vYmplY3QpO1xuICAgIHJldHVybiBzdHlsZXMgPyBgIHN0eWxlPVwiJHtzdHlsZXN9XCJgIDogJyc7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yLCBjdXN0b21FbGVtZW50KSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgaWYgKCFjdXN0b21FbGVtZW50KSB7XG4gICAgICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IGNvbXBvbmVudC4kJC5vbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAvLyBpdCB3aWxsIHVwZGF0ZSB0aGUgYCQkLm9uX2Rlc3Ryb3lgIHJlZmVyZW5jZSB0byBgbnVsbGAuXG4gICAgICAgICAgICAvLyB0aGUgZGVzdHJ1Y3R1cmVkIG9uX2Rlc3Ryb3kgbWF5IHN0aWxsIHJlZmVyZW5jZSB0byB0aGUgb2xkIGFycmF5XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBmbHVzaF9yZW5kZXJfY2FsbGJhY2tzKCQkLmFmdGVyX3VwZGF0ZSk7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGFwcGVuZF9zdHlsZXMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJCA9IHtcbiAgICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAgIGN0eDogW10sXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgb25fZGlzY29ubmVjdDogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKG9wdGlvbnMuY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eSxcbiAgICAgICAgc2tpcF9ib3VuZDogZmFsc2UsXG4gICAgICAgIHJvb3Q6IG9wdGlvbnMudGFyZ2V0IHx8IHBhcmVudF9jb21wb25lbnQuJCQucm9vdFxuICAgIH07XG4gICAgYXBwZW5kX3N0eWxlcyAmJiBhcHBlbmRfc3R5bGVzKCQkLnJvb3QpO1xuICAgIGxldCByZWFkeSA9IGZhbHNlO1xuICAgICQkLmN0eCA9IGluc3RhbmNlXG4gICAgICAgID8gaW5zdGFuY2UoY29tcG9uZW50LCBvcHRpb25zLnByb3BzIHx8IHt9LCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgc3RhcnRfaHlkcmF0aW5nKCk7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKG5vZGVzKTtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvciwgb3B0aW9ucy5jdXN0b21FbGVtZW50KTtcbiAgICAgICAgZW5kX2h5ZHJhdGluZygpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgY29uc3QgeyBvbl9tb3VudCB9ID0gdGhpcy4kJDtcbiAgICAgICAgICAgIHRoaXMuJCQub25fZGlzY29ubmVjdCA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgcnVuX2FsbCh0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QpO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGlmICghaXNfZnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgU3ZlbHRlIGNvbXBvbmVudHMuIFVzZWQgd2hlbiBkZXY9ZmFsc2UuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghaXNfZnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaF9kZXYodHlwZSwgZGV0YWlsKSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQodHlwZSwgT2JqZWN0LmFzc2lnbih7IHZlcnNpb246ICczLjU5LjInIH0sIGRldGFpbCksIHsgYnViYmxlczogdHJ1ZSB9KSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfaHlkcmF0aW9uX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlLCBhbmNob3IgfSk7XG4gICAgaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9oeWRyYXRpb25fZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydF9oeWRyYXRpb24odGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmUnLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbiwgaGFzX3N0b3BfaW1tZWRpYXRlX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFsnY2FwdHVyZSddIDogb3B0aW9ucyA/IEFycmF5LmZyb20oT2JqZWN0LmtleXMob3B0aW9ucykpIDogW107XG4gICAgaWYgKGhhc19wcmV2ZW50X2RlZmF1bHQpXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdwcmV2ZW50RGVmYXVsdCcpO1xuICAgIGlmIChoYXNfc3RvcF9wcm9wYWdhdGlvbilcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3N0b3BQcm9wYWdhdGlvbicpO1xuICAgIGlmIChoYXNfc3RvcF9pbW1lZGlhdGVfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0UHJvcGVydHknLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGFzZXQnLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhJywgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9jb250ZW50ZWRpdGFibGVfZGV2KHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YScsIHsgbm9kZTogdGV4dCwgZGF0YSB9KTtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfbWF5YmVfY29udGVudGVkaXRhYmxlX2Rldih0ZXh0LCBkYXRhLCBhdHRyX3ZhbHVlKSB7XG4gICAgaWYgKH5jb250ZW50ZWRpdGFibGVfdHJ1dGh5X3ZhbHVlcy5pbmRleE9mKGF0dHJfdmFsdWUpKSB7XG4gICAgICAgIHNldF9kYXRhX2NvbnRlbnRlZGl0YWJsZV9kZXYodGV4dCwgZGF0YSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9hcmd1bWVudChhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycgJiYgIShhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgJ2xlbmd0aCcgaW4gYXJnKSkge1xuICAgICAgICBsZXQgbXNnID0gJ3sjZWFjaH0gb25seSBpdGVyYXRlcyBvdmVyIGFycmF5LWxpa2Ugb2JqZWN0cy4nO1xuICAgICAgICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBhcmcgJiYgU3ltYm9sLml0ZXJhdG9yIGluIGFyZykge1xuICAgICAgICAgICAgbXNnICs9ICcgWW91IGNhbiB1c2UgYSBzcHJlYWQgdG8gY29udmVydCB0aGlzIGl0ZXJhYmxlIGludG8gYW4gYXJyYXkuJztcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zbG90cyhuYW1lLCBzbG90LCBrZXlzKSB7XG4gICAgZm9yIChjb25zdCBzbG90X2tleSBvZiBPYmplY3Qua2V5cyhzbG90KSkge1xuICAgICAgICBpZiAoIX5rZXlzLmluZGV4T2Yoc2xvdF9rZXkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYDwke25hbWV9PiByZWNlaXZlZCBhbiB1bmV4cGVjdGVkIHNsb3QgXCIke3Nsb3Rfa2V5fVwiLmApO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfZHluYW1pY19lbGVtZW50KHRhZykge1xuICAgIGNvbnN0IGlzX3N0cmluZyA9IHR5cGVvZiB0YWcgPT09ICdzdHJpbmcnO1xuICAgIGlmICh0YWcgJiYgIWlzX3N0cmluZykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJzxzdmVsdGU6ZWxlbWVudD4gZXhwZWN0cyBcInRoaXNcIiBhdHRyaWJ1dGUgdG8gYmUgYSBzdHJpbmcuJyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfdm9pZF9keW5hbWljX2VsZW1lbnQodGFnKSB7XG4gICAgaWYgKHRhZyAmJiBpc192b2lkKHRhZykpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGA8c3ZlbHRlOmVsZW1lbnQgdGhpcz1cIiR7dGFnfVwiPiBpcyBzZWxmLWNsb3NpbmcgYW5kIGNhbm5vdCBoYXZlIGNvbnRlbnQuYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gY29uc3RydWN0X3N2ZWx0ZV9jb21wb25lbnRfZGV2KGNvbXBvbmVudCwgcHJvcHMpIHtcbiAgICBjb25zdCBlcnJvcl9tZXNzYWdlID0gJ3RoaXM9ey4uLn0gb2YgPHN2ZWx0ZTpjb21wb25lbnQ+IHNob3VsZCBzcGVjaWZ5IGEgU3ZlbHRlIGNvbXBvbmVudC4nO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGNvbXBvbmVudChwcm9wcyk7XG4gICAgICAgIGlmICghaW5zdGFuY2UuJCQgfHwgIWluc3RhbmNlLiRzZXQgfHwgIWluc3RhbmNlLiRvbiB8fCAhaW5zdGFuY2UuJGRlc3Ryb3kpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcl9tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgeyBtZXNzYWdlIH0gPSBlcnI7XG4gICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycgJiYgbWVzc2FnZS5pbmRleE9mKCdpcyBub3QgYSBjb25zdHJ1Y3RvcicpICE9PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yX21lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cyB3aXRoIHNvbWUgbWlub3IgZGV2LWVuaGFuY2VtZW50cy4gVXNlZCB3aGVuIGRldj10cnVlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIndGFyZ2V0JyBpcyBhIHJlcXVpcmVkIG9wdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJGNhcHR1cmVfc3RhdGUoKSB7IH1cbiAgICAkaW5qZWN0X3N0YXRlKCkgeyB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgdG8gY3JlYXRlIHN0cm9uZ2x5IHR5cGVkIFN2ZWx0ZSBjb21wb25lbnRzLlxuICogVGhpcyBvbmx5IGV4aXN0cyBmb3IgdHlwaW5nIHB1cnBvc2VzIGFuZCBzaG91bGQgYmUgdXNlZCBpbiBgLmQudHNgIGZpbGVzLlxuICpcbiAqICMjIyBFeGFtcGxlOlxuICpcbiAqIFlvdSBoYXZlIGNvbXBvbmVudCBsaWJyYXJ5IG9uIG5wbSBjYWxsZWQgYGNvbXBvbmVudC1saWJyYXJ5YCwgZnJvbSB3aGljaFxuICogeW91IGV4cG9ydCBhIGNvbXBvbmVudCBjYWxsZWQgYE15Q29tcG9uZW50YC4gRm9yIFN2ZWx0ZStUeXBlU2NyaXB0IHVzZXJzLFxuICogeW91IHdhbnQgdG8gcHJvdmlkZSB0eXBpbmdzLiBUaGVyZWZvcmUgeW91IGNyZWF0ZSBhIGBpbmRleC5kLnRzYDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBTdmVsdGVDb21wb25lbnRUeXBlZCB9IGZyb20gXCJzdmVsdGVcIjtcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkPHtmb286IHN0cmluZ30+IHt9XG4gKiBgYGBcbiAqIFR5cGluZyB0aGlzIG1ha2VzIGl0IHBvc3NpYmxlIGZvciBJREVzIGxpa2UgVlMgQ29kZSB3aXRoIHRoZSBTdmVsdGUgZXh0ZW5zaW9uXG4gKiB0byBwcm92aWRlIGludGVsbGlzZW5zZSBhbmQgdG8gdXNlIHRoZSBjb21wb25lbnQgbGlrZSB0aGlzIGluIGEgU3ZlbHRlIGZpbGVcbiAqIHdpdGggVHlwZVNjcmlwdDpcbiAqIGBgYHN2ZWx0ZVxuICogPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAqIFx0aW1wb3J0IHsgTXlDb21wb25lbnQgfSBmcm9tIFwiY29tcG9uZW50LWxpYnJhcnlcIjtcbiAqIDwvc2NyaXB0PlxuICogPE15Q29tcG9uZW50IGZvbz17J2Jhcid9IC8+XG4gKiBgYGBcbiAqXG4gKiAjIyMjIFdoeSBub3QgbWFrZSB0aGlzIHBhcnQgb2YgYFN2ZWx0ZUNvbXBvbmVudChEZXYpYD9cbiAqIEJlY2F1c2VcbiAqIGBgYHRzXG4gKiBjbGFzcyBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudDx7Zm9vOiBzdHJpbmd9PiB7fVxuICogY29uc3QgY29tcG9uZW50OiB0eXBlb2YgU3ZlbHRlQ29tcG9uZW50ID0gQVN1YmNsYXNzT2ZTdmVsdGVDb21wb25lbnQ7XG4gKiBgYGBcbiAqIHdpbGwgdGhyb3cgYSB0eXBlIGVycm9yLCBzbyB3ZSBuZWVkIHRvIHNlcGFyYXRlIHRoZSBtb3JlIHN0cmljdGx5IHR5cGVkIGNsYXNzLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnRUeXBlZCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudERldiB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGUgbG9vcCBkZXRlY3RlZCcpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgSHRtbFRhZ0h5ZHJhdGlvbiwgUmVzaXplT2JzZXJ2ZXJTaW5nbGV0b24sIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVDb21wb25lbnRUeXBlZCwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2lmcmFtZV9yZXNpemVfbGlzdGVuZXIsIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3N0eWxlcywgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQsIGFwcGVuZF9oeWRyYXRpb24sIGFwcGVuZF9oeWRyYXRpb25fZGV2LCBhcHBlbmRfc3R5bGVzLCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tbWVudCwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9odG1sX3RhZywgY2xhaW1fc3BhY2UsIGNsYWltX3N2Z19lbGVtZW50LCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tbWVudCwgY29tcG9uZW50X3N1YnNjcmliZSwgY29tcHV0ZV9yZXN0X3Byb3BzLCBjb21wdXRlX3Nsb3RzLCBjb25zdHJ1Y3Rfc3ZlbHRlX2NvbXBvbmVudCwgY29uc3RydWN0X3N2ZWx0ZV9jb21wb25lbnRfZGV2LCBjb250ZW50ZWRpdGFibGVfdHJ1dGh5X3ZhbHVlcywgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlbmRfaHlkcmF0aW5nLCBlc2NhcGUsIGVzY2FwZV9hdHRyaWJ1dGVfdmFsdWUsIGVzY2FwZV9vYmplY3QsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZmx1c2hfcmVuZGVyX2NhbGxiYWNrcywgZ2V0QWxsQ29udGV4dHMsIGdldENvbnRleHQsIGdldF9hbGxfZGlydHlfZnJvbV9zY29wZSwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cywgZ2V0X3Jvb3RfZm9yX3N0eWxlLCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzQ29udGV4dCwgaGFzX3Byb3AsIGhlYWRfc2VsZWN0b3IsIGlkZW50aXR5LCBpbml0LCBpbml0X2JpbmRpbmdfZ3JvdXAsIGluaXRfYmluZGluZ19ncm91cF9keW5hbWljLCBpbnNlcnQsIGluc2VydF9kZXYsIGluc2VydF9oeWRyYXRpb24sIGluc2VydF9oeWRyYXRpb25fZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Nyb3Nzb3JpZ2luLCBpc19lbXB0eSwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGlzX3ZvaWQsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWVyZ2Vfc3NyX3N0eWxlcywgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHF1ZXJ5X3NlbGVjdG9yX2FsbCwgcmFmLCByZXNpemVfb2JzZXJ2ZXJfYm9yZGVyX2JveCwgcmVzaXplX29ic2VydmVyX2NvbnRlbnRfYm94LCByZXNpemVfb2JzZXJ2ZXJfZGV2aWNlX3BpeGVsX2NvbnRlbnRfYm94LCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhX21hcCwgc2V0X2RhdGEsIHNldF9kYXRhX2NvbnRlbnRlZGl0YWJsZSwgc2V0X2RhdGFfY29udGVudGVkaXRhYmxlX2Rldiwgc2V0X2RhdGFfZGV2LCBzZXRfZGF0YV9tYXliZV9jb250ZW50ZWRpdGFibGUsIHNldF9kYXRhX21heWJlX2NvbnRlbnRlZGl0YWJsZV9kZXYsIHNldF9keW5hbWljX2VsZW1lbnRfZGF0YSwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwbGl0X2Nzc191bml0LCBzcHJlYWQsIHNyY191cmxfZXF1YWwsIHN0YXJ0X2h5ZHJhdGluZywgc3RvcF9pbW1lZGlhdGVfcHJvcGFnYXRpb24sIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHRydXN0ZWQsIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2gsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdXBkYXRlX3Nsb3RfYmFzZSwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9keW5hbWljX2VsZW1lbnQsIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQsIHZhbGlkYXRlX2VhY2hfa2V5cywgdmFsaWRhdGVfc2xvdHMsIHZhbGlkYXRlX3N0b3JlLCB2YWxpZGF0ZV92b2lkX2R5bmFtaWNfZWxlbWVudCwgeGxpbmtfYXR0ciB9O1xuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhdGUge1xuICBkZWJ1ZyA9IGZhbHNlXG4gIHNlY3Rpb25zOiBTZWN0aW9uU3RhdGVbXVxufVxuXG5leHBvcnQgdHlwZSBTZWN0aW9uU3RhdGUgPSB7XG4gIG5hbWU6IHN0cmluZ1xuICBjaGlsZHJlbjogU2VjdGlvbkNoaWxkW11cbn1cblxuZXhwb3J0IHR5cGUgU2VjdGlvbkNoaWxkID0gQ2xvY2tTdGF0ZSB8IENvdW50ZXJTdGF0ZSB8IFN0b3B3YXRjaFN0YXRlXG5cbmV4cG9ydCB0eXBlIENsb2NrU3RhdGUgPSB7XG4gIHR5cGU6ICdjbG9jaydcbiAgbmFtZTogc3RyaW5nXG4gIHNlZ21lbnRzOiBudW1iZXJcbiAgZmlsbGVkOiBudW1iZXJcbn1cblxuZXhwb3J0IHR5cGUgQ291bnRlclN0YXRlID0ge1xuICB0eXBlOiAnY291bnRlcidcbiAgbmFtZTogc3RyaW5nXG4gIHZhbHVlOiBudW1iZXJcbn1cblxuZXhwb3J0IHR5cGUgU3RvcHdhdGNoU3RhdGUgPSB7XG4gIHR5cGU6ICdzdG9wd2F0Y2gnXG4gIG5hbWU6IHN0cmluZ1xuICBzdGFydE1pbGxpczogbnVtYmVyXG4gIG9mZnNldE1pbGxpczogbnVtYmVyXG4gIHNob3dNaWxsaXM6IGJvb2xlYW5cbiAgaXNSdW5uaW5nOiBib29sZWFuXG4gIGxhcFRpbWVzOiBudW1iZXJbXVxufVxuIiwiLyoqXG4gKiBAbGljZW5zZSBsdWNpZGUtc3ZlbHRlIHYwLjMzMS4wIC0gSVNDXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgSVNDIGxpY2Vuc2UuXG4gKiBTZWUgdGhlIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuY29uc3QgZGVmYXVsdEF0dHJpYnV0ZXMgPSB7XG4gICAgeG1sbnM6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsXG4gICAgd2lkdGg6IDI0LFxuICAgIGhlaWdodDogMjQsXG4gICAgdmlld0JveDogJzAgMCAyNCAyNCcsXG4gICAgZmlsbDogJ25vbmUnLFxuICAgIHN0cm9rZTogJ2N1cnJlbnRDb2xvcicsXG4gICAgJ3N0cm9rZS13aWR0aCc6IDIsXG4gICAgJ3N0cm9rZS1saW5lY2FwJzogJ3JvdW5kJyxcbiAgICAnc3Ryb2tlLWxpbmVqb2luJzogJ3JvdW5kJyxcbn07XG5leHBvcnQgZGVmYXVsdCBkZWZhdWx0QXR0cmlidXRlcztcbiIsIjxzY3JpcHQ+aW1wb3J0IGRlZmF1bHRBdHRyaWJ1dGVzIGZyb20gJy4vZGVmYXVsdEF0dHJpYnV0ZXMnO1xuZXhwb3J0IGxldCBuYW1lO1xuZXhwb3J0IGxldCBjb2xvciA9ICdjdXJyZW50Q29sb3InO1xuZXhwb3J0IGxldCBzaXplID0gMjQ7XG5leHBvcnQgbGV0IHN0cm9rZVdpZHRoID0gMjtcbmV4cG9ydCBsZXQgYWJzb2x1dGVTdHJva2VXaWR0aCA9IGZhbHNlO1xuZXhwb3J0IGxldCBpY29uTm9kZTtcbjwvc2NyaXB0PlxuXG48c3ZnXG4gIHsuLi5kZWZhdWx0QXR0cmlidXRlc31cbiAgey4uLiQkcmVzdFByb3BzfVxuICB3aWR0aD17c2l6ZX1cbiAgaGVpZ2h0PXtzaXplfVxuICBzdHJva2U9e2NvbG9yfVxuICBzdHJva2Utd2lkdGg9e1xuICAgIGFic29sdXRlU3Ryb2tlV2lkdGhcbiAgICAgID8gTnVtYmVyKHN0cm9rZVdpZHRoKSAqIDI0IC8gTnVtYmVyKHNpemUpXG4gICAgICA6IHN0cm9rZVdpZHRoXG4gIH1cbiAgY2xhc3M9e2BsdWNpZGUtaWNvbiBsdWNpZGUgbHVjaWRlLSR7bmFtZX0gJHskJHByb3BzLmNsYXNzID8/ICcnfWB9XG4+XG4gIHsjZWFjaCBpY29uTm9kZSBhcyBbdGFnLCBhdHRyc119XG4gICAgPHN2ZWx0ZTplbGVtZW50IHRoaXM9e3RhZ30gey4uLmF0dHJzfS8+XG4gIHsvZWFjaH1cbiAgPHNsb3QgLz5cbjwvc3ZnPlxuIiwiPHNjcmlwdD4vKipcbiAqIEBsaWNlbnNlIGx1Y2lkZS1zdmVsdGUgdjAuMzMxLjAgLSBJU0NcbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBJU0MgbGljZW5zZS5cbiAqIFNlZSB0aGUgTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5pbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSc7XG5jb25zdCBpY29uTm9kZSA9IFtbXCJwYXRoXCIsIHsgXCJkXCI6IFwiTTE5IDNINVwiIH1dLCBbXCJwYXRoXCIsIHsgXCJkXCI6IFwiTTEyIDIxVjdcIiB9XSwgW1wicGF0aFwiLCB7IFwiZFwiOiBcIm02IDE1IDYgNiA2LTZcIiB9XV07XG4vKipcbiAqIEBjb21wb25lbnQgQG5hbWUgQXJyb3dEb3duRnJvbUxpbmVcbiAqIEBkZXNjcmlwdGlvbiBMdWNpZGUgU1ZHIGljb24gY29tcG9uZW50LCByZW5kZXJzIFNWRyBFbGVtZW50IHdpdGggY2hpbGRyZW4uXG4gKlxuICogQHByZXZpZXcgIVtpbWddKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QWdlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklnb2dJSGRwWkhSb1BTSXlOQ0lLSUNCb1pXbG5hSFE5SWpJMElnb2dJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lLSUNCbWFXeHNQU0p1YjI1bElnb2dJSE4wY205clpUMGlJekF3TUNJZ2MzUjViR1U5SW1KaFkydG5jbTkxYm1RdFkyOXNiM0k2SUNObVptWTdJR0p2Y21SbGNpMXlZV1JwZFhNNklESndlQ0lLSUNCemRISnZhMlV0ZDJsa2RHZzlJaklpQ2lBZ2MzUnliMnRsTFd4cGJtVmpZWEE5SW5KdmRXNWtJZ29nSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlDajRLSUNBOGNHRjBhQ0JrUFNKTk1Ua2dNMGcxSWlBdlBnb2dJRHh3WVhSb0lHUTlJazB4TWlBeU1WWTNJaUF2UGdvZ0lEeHdZWFJvSUdROUltMDJJREUxSURZZ05pQTJMVFlpSUM4K0Nqd3ZjM1puUGdvPSkgLSBodHRwczovL2x1Y2lkZS5kZXYvaWNvbnMvYXJyb3ctZG93bi1mcm9tLWxpbmVcbiAqIEBzZWUgaHR0cHM6Ly9sdWNpZGUuZGV2L2d1aWRlL3BhY2thZ2VzL2x1Y2lkZS1zdmVsdGUgLSBEb2N1bWVudGF0aW9uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gTHVjaWRlIGljb25zIHByb3BzIGFuZCBhbnkgdmFsaWQgU1ZHIGF0dHJpYnV0ZVxuICogQHJldHVybnMge0Z1bmN0aW9uYWxDb21wb25lbnR9IFN2ZWx0ZSBjb21wb25lbnRcbiAqXG4gKi9cbjwvc2NyaXB0PlxuXG48SWNvbiBuYW1lPVwiYXJyb3ctZG93bi1mcm9tLWxpbmVcIiB7Li4uJCRwcm9wc30gaWNvbk5vZGU9e2ljb25Ob2RlfT5cbiAgPHNsb3QvPlxuPC9JY29uPlxuIiwiPHNjcmlwdD4vKipcbiAqIEBsaWNlbnNlIGx1Y2lkZS1zdmVsdGUgdjAuMzMxLjAgLSBJU0NcbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBJU0MgbGljZW5zZS5cbiAqIFNlZSB0aGUgTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5pbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSc7XG5jb25zdCBpY29uTm9kZSA9IFtbXCJwYXRoXCIsIHsgXCJkXCI6IFwibTE4IDktNi02LTYgNlwiIH1dLCBbXCJwYXRoXCIsIHsgXCJkXCI6IFwiTTEyIDN2MTRcIiB9XSwgW1wicGF0aFwiLCB7IFwiZFwiOiBcIk01IDIxaDE0XCIgfV1dO1xuLyoqXG4gKiBAY29tcG9uZW50IEBuYW1lIEFycm93VXBGcm9tTGluZVxuICogQGRlc2NyaXB0aW9uIEx1Y2lkZSBTVkcgaWNvbiBjb21wb25lbnQsIHJlbmRlcnMgU1ZHIEVsZW1lbnQgd2l0aCBjaGlsZHJlbi5cbiAqXG4gKiBAcHJldmlldyAhW2ltZ10oZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lIZHBaSFJvUFNJeU5DSUtJQ0JvWldsbmFIUTlJakkwSWdvZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSUtJQ0JtYVd4c1BTSnViMjVsSWdvZ0lITjBjbTlyWlQwaUl6QXdNQ0lnYzNSNWJHVTlJbUpoWTJ0bmNtOTFibVF0WTI5c2IzSTZJQ05tWm1ZN0lHSnZjbVJsY2kxeVlXUnBkWE02SURKd2VDSUtJQ0J6ZEhKdmEyVXRkMmxrZEdnOUlqSWlDaUFnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lnb2dJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUNqNEtJQ0E4Y0dGMGFDQmtQU0p0TVRnZ09TMDJMVFl0TmlBMklpQXZQZ29nSUR4d1lYUm9JR1E5SWsweE1pQXpkakUwSWlBdlBnb2dJRHh3WVhSb0lHUTlJazAxSURJeGFERTBJaUF2UGdvOEwzTjJaejRLKSAtIGh0dHBzOi8vbHVjaWRlLmRldi9pY29ucy9hcnJvdy11cC1mcm9tLWxpbmVcbiAqIEBzZWUgaHR0cHM6Ly9sdWNpZGUuZGV2L2d1aWRlL3BhY2thZ2VzL2x1Y2lkZS1zdmVsdGUgLSBEb2N1bWVudGF0aW9uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gTHVjaWRlIGljb25zIHByb3BzIGFuZCBhbnkgdmFsaWQgU1ZHIGF0dHJpYnV0ZVxuICogQHJldHVybnMge0Z1bmN0aW9uYWxDb21wb25lbnR9IFN2ZWx0ZSBjb21wb25lbnRcbiAqXG4gKi9cbjwvc2NyaXB0PlxuXG48SWNvbiBuYW1lPVwiYXJyb3ctdXAtZnJvbS1saW5lXCIgey4uLiQkcHJvcHN9IGljb25Ob2RlPXtpY29uTm9kZX0+XG4gIDxzbG90Lz5cbjwvSWNvbj5cbiIsIjxzY3JpcHQ+LyoqXG4gKiBAbGljZW5zZSBsdWNpZGUtc3ZlbHRlIHYwLjMzMS4wIC0gSVNDXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgSVNDIGxpY2Vuc2UuXG4gKiBTZWUgdGhlIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnO1xuY29uc3QgaWNvbk5vZGUgPSBbW1wicmVjdFwiLCB7IFwid2lkdGhcIjogXCIxOFwiLCBcImhlaWdodFwiOiBcIjE4XCIsIFwieFwiOiBcIjNcIiwgXCJ5XCI6IFwiM1wiLCBcInJ4XCI6IFwiMlwiIH1dLCBbXCJwYXRoXCIsIHsgXCJkXCI6IFwiTTggMTJoOFwiIH1dXTtcbi8qKlxuICogQGNvbXBvbmVudCBAbmFtZSBNaW51c1NxdWFyZVxuICogQGRlc2NyaXB0aW9uIEx1Y2lkZSBTVkcgaWNvbiBjb21wb25lbnQsIHJlbmRlcnMgU1ZHIEVsZW1lbnQgd2l0aCBjaGlsZHJlbi5cbiAqXG4gKiBAcHJldmlldyAhW2ltZ10oZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lIZHBaSFJvUFNJeU5DSUtJQ0JvWldsbmFIUTlJakkwSWdvZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSUtJQ0JtYVd4c1BTSnViMjVsSWdvZ0lITjBjbTlyWlQwaUl6QXdNQ0lnYzNSNWJHVTlJbUpoWTJ0bmNtOTFibVF0WTI5c2IzSTZJQ05tWm1ZN0lHSnZjbVJsY2kxeVlXUnBkWE02SURKd2VDSUtJQ0J6ZEhKdmEyVXRkMmxrZEdnOUlqSWlDaUFnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lnb2dJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUNqNEtJQ0E4Y21WamRDQjNhV1IwYUQwaU1UZ2lJR2hsYVdkb2REMGlNVGdpSUhnOUlqTWlJSGs5SWpNaUlISjRQU0l5SWlBdlBnb2dJRHh3WVhSb0lHUTlJazA0SURFeWFEZ2lJQzgrQ2p3dmMzWm5QZ289KSAtIGh0dHBzOi8vbHVjaWRlLmRldi9pY29ucy9taW51cy1zcXVhcmVcbiAqIEBzZWUgaHR0cHM6Ly9sdWNpZGUuZGV2L2d1aWRlL3BhY2thZ2VzL2x1Y2lkZS1zdmVsdGUgLSBEb2N1bWVudGF0aW9uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gTHVjaWRlIGljb25zIHByb3BzIGFuZCBhbnkgdmFsaWQgU1ZHIGF0dHJpYnV0ZVxuICogQHJldHVybnMge0Z1bmN0aW9uYWxDb21wb25lbnR9IFN2ZWx0ZSBjb21wb25lbnRcbiAqXG4gKi9cbjwvc2NyaXB0PlxuXG48SWNvbiBuYW1lPVwibWludXMtc3F1YXJlXCIgey4uLiQkcHJvcHN9IGljb25Ob2RlPXtpY29uTm9kZX0+XG4gIDxzbG90Lz5cbjwvSWNvbj5cbiIsIjxzY3JpcHQ+LyoqXG4gKiBAbGljZW5zZSBsdWNpZGUtc3ZlbHRlIHYwLjMzMS4wIC0gSVNDXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgSVNDIGxpY2Vuc2UuXG4gKiBTZWUgdGhlIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnO1xuY29uc3QgaWNvbk5vZGUgPSBbW1wicmVjdFwiLCB7IFwid2lkdGhcIjogXCI0XCIsIFwiaGVpZ2h0XCI6IFwiMTZcIiwgXCJ4XCI6IFwiNlwiLCBcInlcIjogXCI0XCIgfV0sIFtcInJlY3RcIiwgeyBcIndpZHRoXCI6IFwiNFwiLCBcImhlaWdodFwiOiBcIjE2XCIsIFwieFwiOiBcIjE0XCIsIFwieVwiOiBcIjRcIiB9XV07XG4vKipcbiAqIEBjb21wb25lbnQgQG5hbWUgUGF1c2VcbiAqIEBkZXNjcmlwdGlvbiBMdWNpZGUgU1ZHIGljb24gY29tcG9uZW50LCByZW5kZXJzIFNWRyBFbGVtZW50IHdpdGggY2hpbGRyZW4uXG4gKlxuICogQHByZXZpZXcgIVtpbWddKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QWdlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklnb2dJSGRwWkhSb1BTSXlOQ0lLSUNCb1pXbG5hSFE5SWpJMElnb2dJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lLSUNCbWFXeHNQU0p1YjI1bElnb2dJSE4wY205clpUMGlJekF3TUNJZ2MzUjViR1U5SW1KaFkydG5jbTkxYm1RdFkyOXNiM0k2SUNObVptWTdJR0p2Y21SbGNpMXlZV1JwZFhNNklESndlQ0lLSUNCemRISnZhMlV0ZDJsa2RHZzlJaklpQ2lBZ2MzUnliMnRsTFd4cGJtVmpZWEE5SW5KdmRXNWtJZ29nSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlDajRLSUNBOGNtVmpkQ0IzYVdSMGFEMGlOQ0lnYUdWcFoyaDBQU0l4TmlJZ2VEMGlOaUlnZVQwaU5DSWdMejRLSUNBOGNtVmpkQ0IzYVdSMGFEMGlOQ0lnYUdWcFoyaDBQU0l4TmlJZ2VEMGlNVFFpSUhrOUlqUWlJQzgrQ2p3dmMzWm5QZ289KSAtIGh0dHBzOi8vbHVjaWRlLmRldi9pY29ucy9wYXVzZVxuICogQHNlZSBodHRwczovL2x1Y2lkZS5kZXYvZ3VpZGUvcGFja2FnZXMvbHVjaWRlLXN2ZWx0ZSAtIERvY3VtZW50YXRpb25cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBMdWNpZGUgaWNvbnMgcHJvcHMgYW5kIGFueSB2YWxpZCBTVkcgYXR0cmlidXRlXG4gKiBAcmV0dXJucyB7RnVuY3Rpb25hbENvbXBvbmVudH0gU3ZlbHRlIGNvbXBvbmVudFxuICpcbiAqL1xuPC9zY3JpcHQ+XG5cbjxJY29uIG5hbWU9XCJwYXVzZVwiIHsuLi4kJHByb3BzfSBpY29uTm9kZT17aWNvbk5vZGV9PlxuICA8c2xvdC8+XG48L0ljb24+XG4iLCI8c2NyaXB0Pi8qKlxuICogQGxpY2Vuc2UgbHVjaWRlLXN2ZWx0ZSB2MC4zMzEuMCAtIElTQ1xuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIElTQyBsaWNlbnNlLlxuICogU2VlIHRoZSBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbmltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJztcbmNvbnN0IGljb25Ob2RlID0gW1tcInBhdGhcIiwgeyBcImRcIjogXCJNMjEuMjEgMTUuODlBMTAgMTAgMCAxIDEgOCAyLjgzXCIgfV0sIFtcInBhdGhcIiwgeyBcImRcIjogXCJNMjIgMTJBMTAgMTAgMCAwIDAgMTIgMnYxMHpcIiB9XV07XG4vKipcbiAqIEBjb21wb25lbnQgQG5hbWUgUGllQ2hhcnRcbiAqIEBkZXNjcmlwdGlvbiBMdWNpZGUgU1ZHIGljb24gY29tcG9uZW50LCByZW5kZXJzIFNWRyBFbGVtZW50IHdpdGggY2hpbGRyZW4uXG4gKlxuICogQHByZXZpZXcgIVtpbWddKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QWdlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklnb2dJSGRwWkhSb1BTSXlOQ0lLSUNCb1pXbG5hSFE5SWpJMElnb2dJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lLSUNCbWFXeHNQU0p1YjI1bElnb2dJSE4wY205clpUMGlJekF3TUNJZ2MzUjViR1U5SW1KaFkydG5jbTkxYm1RdFkyOXNiM0k2SUNObVptWTdJR0p2Y21SbGNpMXlZV1JwZFhNNklESndlQ0lLSUNCemRISnZhMlV0ZDJsa2RHZzlJaklpQ2lBZ2MzUnliMnRsTFd4cGJtVmpZWEE5SW5KdmRXNWtJZ29nSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlDajRLSUNBOGNHRjBhQ0JrUFNKTk1qRXVNakVnTVRVdU9EbEJNVEFnTVRBZ01DQXhJREVnT0NBeUxqZ3pJaUF2UGdvZ0lEeHdZWFJvSUdROUlrMHlNaUF4TWtFeE1DQXhNQ0F3SURBZ01DQXhNaUF5ZGpFd2VpSWdMejRLUEM5emRtYytDZz09KSAtIGh0dHBzOi8vbHVjaWRlLmRldi9pY29ucy9waWUtY2hhcnRcbiAqIEBzZWUgaHR0cHM6Ly9sdWNpZGUuZGV2L2d1aWRlL3BhY2thZ2VzL2x1Y2lkZS1zdmVsdGUgLSBEb2N1bWVudGF0aW9uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gTHVjaWRlIGljb25zIHByb3BzIGFuZCBhbnkgdmFsaWQgU1ZHIGF0dHJpYnV0ZVxuICogQHJldHVybnMge0Z1bmN0aW9uYWxDb21wb25lbnR9IFN2ZWx0ZSBjb21wb25lbnRcbiAqXG4gKi9cbjwvc2NyaXB0PlxuXG48SWNvbiBuYW1lPVwicGllLWNoYXJ0XCIgey4uLiQkcHJvcHN9IGljb25Ob2RlPXtpY29uTm9kZX0+XG4gIDxzbG90Lz5cbjwvSWNvbj5cbiIsIjxzY3JpcHQ+LyoqXG4gKiBAbGljZW5zZSBsdWNpZGUtc3ZlbHRlIHYwLjMzMS4wIC0gSVNDXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgSVNDIGxpY2Vuc2UuXG4gKiBTZWUgdGhlIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnO1xuY29uc3QgaWNvbk5vZGUgPSBbW1wicG9seWdvblwiLCB7IFwicG9pbnRzXCI6IFwiNSAzIDE5IDEyIDUgMjEgNSAzXCIgfV1dO1xuLyoqXG4gKiBAY29tcG9uZW50IEBuYW1lIFBsYXlcbiAqIEBkZXNjcmlwdGlvbiBMdWNpZGUgU1ZHIGljb24gY29tcG9uZW50LCByZW5kZXJzIFNWRyBFbGVtZW50IHdpdGggY2hpbGRyZW4uXG4gKlxuICogQHByZXZpZXcgIVtpbWddKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QWdlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklnb2dJSGRwWkhSb1BTSXlOQ0lLSUNCb1pXbG5hSFE5SWpJMElnb2dJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lLSUNCbWFXeHNQU0p1YjI1bElnb2dJSE4wY205clpUMGlJekF3TUNJZ2MzUjViR1U5SW1KaFkydG5jbTkxYm1RdFkyOXNiM0k2SUNObVptWTdJR0p2Y21SbGNpMXlZV1JwZFhNNklESndlQ0lLSUNCemRISnZhMlV0ZDJsa2RHZzlJaklpQ2lBZ2MzUnliMnRsTFd4cGJtVmpZWEE5SW5KdmRXNWtJZ29nSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlDajRLSUNBOGNHOXNlV2R2YmlCd2IybHVkSE05SWpVZ015QXhPU0F4TWlBMUlESXhJRFVnTXlJZ0x6NEtQQzl6ZG1jK0NnPT0pIC0gaHR0cHM6Ly9sdWNpZGUuZGV2L2ljb25zL3BsYXlcbiAqIEBzZWUgaHR0cHM6Ly9sdWNpZGUuZGV2L2d1aWRlL3BhY2thZ2VzL2x1Y2lkZS1zdmVsdGUgLSBEb2N1bWVudGF0aW9uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gTHVjaWRlIGljb25zIHByb3BzIGFuZCBhbnkgdmFsaWQgU1ZHIGF0dHJpYnV0ZVxuICogQHJldHVybnMge0Z1bmN0aW9uYWxDb21wb25lbnR9IFN2ZWx0ZSBjb21wb25lbnRcbiAqXG4gKi9cbjwvc2NyaXB0PlxuXG48SWNvbiBuYW1lPVwicGxheVwiIHsuLi4kJHByb3BzfSBpY29uTm9kZT17aWNvbk5vZGV9PlxuICA8c2xvdC8+XG48L0ljb24+XG4iLCI8c2NyaXB0Pi8qKlxuICogQGxpY2Vuc2UgbHVjaWRlLXN2ZWx0ZSB2MC4zMzEuMCAtIElTQ1xuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIElTQyBsaWNlbnNlLlxuICogU2VlIHRoZSBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbmltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJztcbmNvbnN0IGljb25Ob2RlID0gW1tcInJlY3RcIiwgeyBcIndpZHRoXCI6IFwiMThcIiwgXCJoZWlnaHRcIjogXCIxOFwiLCBcInhcIjogXCIzXCIsIFwieVwiOiBcIjNcIiwgXCJyeFwiOiBcIjJcIiB9XSwgW1wicGF0aFwiLCB7IFwiZFwiOiBcIk04IDEyaDhcIiB9XSwgW1wicGF0aFwiLCB7IFwiZFwiOiBcIk0xMiA4djhcIiB9XV07XG4vKipcbiAqIEBjb21wb25lbnQgQG5hbWUgUGx1c1NxdWFyZVxuICogQGRlc2NyaXB0aW9uIEx1Y2lkZSBTVkcgaWNvbiBjb21wb25lbnQsIHJlbmRlcnMgU1ZHIEVsZW1lbnQgd2l0aCBjaGlsZHJlbi5cbiAqXG4gKiBAcHJldmlldyAhW2ltZ10oZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lIZHBaSFJvUFNJeU5DSUtJQ0JvWldsbmFIUTlJakkwSWdvZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSUtJQ0JtYVd4c1BTSnViMjVsSWdvZ0lITjBjbTlyWlQwaUl6QXdNQ0lnYzNSNWJHVTlJbUpoWTJ0bmNtOTFibVF0WTI5c2IzSTZJQ05tWm1ZN0lHSnZjbVJsY2kxeVlXUnBkWE02SURKd2VDSUtJQ0J6ZEhKdmEyVXRkMmxrZEdnOUlqSWlDaUFnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lnb2dJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUNqNEtJQ0E4Y21WamRDQjNhV1IwYUQwaU1UZ2lJR2hsYVdkb2REMGlNVGdpSUhnOUlqTWlJSGs5SWpNaUlISjRQU0l5SWlBdlBnb2dJRHh3WVhSb0lHUTlJazA0SURFeWFEZ2lJQzgrQ2lBZ1BIQmhkR2dnWkQwaVRURXlJRGgyT0NJZ0x6NEtQQzl6ZG1jK0NnPT0pIC0gaHR0cHM6Ly9sdWNpZGUuZGV2L2ljb25zL3BsdXMtc3F1YXJlXG4gKiBAc2VlIGh0dHBzOi8vbHVjaWRlLmRldi9ndWlkZS9wYWNrYWdlcy9sdWNpZGUtc3ZlbHRlIC0gRG9jdW1lbnRhdGlvblxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIEx1Y2lkZSBpY29ucyBwcm9wcyBhbmQgYW55IHZhbGlkIFNWRyBhdHRyaWJ1dGVcbiAqIEByZXR1cm5zIHtGdW5jdGlvbmFsQ29tcG9uZW50fSBTdmVsdGUgY29tcG9uZW50XG4gKlxuICovXG48L3NjcmlwdD5cblxuPEljb24gbmFtZT1cInBsdXMtc3F1YXJlXCIgey4uLiQkcHJvcHN9IGljb25Ob2RlPXtpY29uTm9kZX0+XG4gIDxzbG90Lz5cbjwvSWNvbj5cbiIsIjxzY3JpcHQ+LyoqXG4gKiBAbGljZW5zZSBsdWNpZGUtc3ZlbHRlIHYwLjMzMS4wIC0gSVNDXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgSVNDIGxpY2Vuc2UuXG4gKiBTZWUgdGhlIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnO1xuY29uc3QgaWNvbk5vZGUgPSBbW1wicGF0aFwiLCB7IFwiZFwiOiBcIk0yMSAxMmE5IDkgMCAwIDAtOS05IDkuNzUgOS43NSAwIDAgMC02Ljc0IDIuNzRMMyA4XCIgfV0sIFtcInBhdGhcIiwgeyBcImRcIjogXCJNMyAzdjVoNVwiIH1dLCBbXCJwYXRoXCIsIHsgXCJkXCI6IFwiTTMgMTJhOSA5IDAgMCAwIDkgOSA5Ljc1IDkuNzUgMCAwIDAgNi43NC0yLjc0TDIxIDE2XCIgfV0sIFtcInBhdGhcIiwgeyBcImRcIjogXCJNMTYgMTZoNXY1XCIgfV1dO1xuLyoqXG4gKiBAY29tcG9uZW50IEBuYW1lIFJlZnJlc2hDY3dcbiAqIEBkZXNjcmlwdGlvbiBMdWNpZGUgU1ZHIGljb24gY29tcG9uZW50LCByZW5kZXJzIFNWRyBFbGVtZW50IHdpdGggY2hpbGRyZW4uXG4gKlxuICogQHByZXZpZXcgIVtpbWddKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QWdlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklnb2dJSGRwWkhSb1BTSXlOQ0lLSUNCb1pXbG5hSFE5SWpJMElnb2dJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lLSUNCbWFXeHNQU0p1YjI1bElnb2dJSE4wY205clpUMGlJekF3TUNJZ2MzUjViR1U5SW1KaFkydG5jbTkxYm1RdFkyOXNiM0k2SUNObVptWTdJR0p2Y21SbGNpMXlZV1JwZFhNNklESndlQ0lLSUNCemRISnZhMlV0ZDJsa2RHZzlJaklpQ2lBZ2MzUnliMnRsTFd4cGJtVmpZWEE5SW5KdmRXNWtJZ29nSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlDajRLSUNBOGNHRjBhQ0JrUFNKTk1qRWdNVEpoT1NBNUlEQWdNQ0F3TFRrdE9TQTVMamMxSURrdU56VWdNQ0F3SURBdE5pNDNOQ0F5TGpjMFRETWdPQ0lnTHo0S0lDQThjR0YwYUNCa1BTSk5NeUF6ZGpWb05TSWdMejRLSUNBOGNHRjBhQ0JrUFNKTk15QXhNbUU1SURrZ01DQXdJREFnT1NBNUlEa3VOelVnT1M0M05TQXdJREFnTUNBMkxqYzBMVEl1TnpSTU1qRWdNVFlpSUM4K0NpQWdQSEJoZEdnZ1pEMGlUVEUySURFMmFEVjJOU0lnTHo0S1BDOXpkbWMrQ2c9PSkgLSBodHRwczovL2x1Y2lkZS5kZXYvaWNvbnMvcmVmcmVzaC1jY3dcbiAqIEBzZWUgaHR0cHM6Ly9sdWNpZGUuZGV2L2d1aWRlL3BhY2thZ2VzL2x1Y2lkZS1zdmVsdGUgLSBEb2N1bWVudGF0aW9uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gTHVjaWRlIGljb25zIHByb3BzIGFuZCBhbnkgdmFsaWQgU1ZHIGF0dHJpYnV0ZVxuICogQHJldHVybnMge0Z1bmN0aW9uYWxDb21wb25lbnR9IFN2ZWx0ZSBjb21wb25lbnRcbiAqXG4gKi9cbjwvc2NyaXB0PlxuXG48SWNvbiBuYW1lPVwicmVmcmVzaC1jY3dcIiB7Li4uJCRwcm9wc30gaWNvbk5vZGU9e2ljb25Ob2RlfT5cbiAgPHNsb3QvPlxuPC9JY29uPlxuIiwiPHNjcmlwdD4vKipcbiAqIEBsaWNlbnNlIGx1Y2lkZS1zdmVsdGUgdjAuMzMxLjAgLSBJU0NcbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBJU0MgbGljZW5zZS5cbiAqIFNlZSB0aGUgTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5pbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSc7XG5jb25zdCBpY29uTm9kZSA9IFtbXCJsaW5lXCIsIHsgXCJ4MVwiOiBcIjEwXCIsIFwieDJcIjogXCIxNFwiLCBcInkxXCI6IFwiMlwiLCBcInkyXCI6IFwiMlwiIH1dLCBbXCJsaW5lXCIsIHsgXCJ4MVwiOiBcIjEyXCIsIFwieDJcIjogXCIxNVwiLCBcInkxXCI6IFwiMTRcIiwgXCJ5MlwiOiBcIjExXCIgfV0sIFtcImNpcmNsZVwiLCB7IFwiY3hcIjogXCIxMlwiLCBcImN5XCI6IFwiMTRcIiwgXCJyXCI6IFwiOFwiIH1dXTtcbi8qKlxuICogQGNvbXBvbmVudCBAbmFtZSBUaW1lclxuICogQGRlc2NyaXB0aW9uIEx1Y2lkZSBTVkcgaWNvbiBjb21wb25lbnQsIHJlbmRlcnMgU1ZHIEVsZW1lbnQgd2l0aCBjaGlsZHJlbi5cbiAqXG4gKiBAcHJldmlldyAhW2ltZ10oZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lIZHBaSFJvUFNJeU5DSUtJQ0JvWldsbmFIUTlJakkwSWdvZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSUtJQ0JtYVd4c1BTSnViMjVsSWdvZ0lITjBjbTlyWlQwaUl6QXdNQ0lnYzNSNWJHVTlJbUpoWTJ0bmNtOTFibVF0WTI5c2IzSTZJQ05tWm1ZN0lHSnZjbVJsY2kxeVlXUnBkWE02SURKd2VDSUtJQ0J6ZEhKdmEyVXRkMmxrZEdnOUlqSWlDaUFnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lnb2dJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUNqNEtJQ0E4YkdsdVpTQjRNVDBpTVRBaUlIZ3lQU0l4TkNJZ2VURTlJaklpSUhreVBTSXlJaUF2UGdvZ0lEeHNhVzVsSUhneFBTSXhNaUlnZURJOUlqRTFJaUI1TVQwaU1UUWlJSGt5UFNJeE1TSWdMejRLSUNBOFkybHlZMnhsSUdONFBTSXhNaUlnWTNrOUlqRTBJaUJ5UFNJNElpQXZQZ284TDNOMlp6NEspIC0gaHR0cHM6Ly9sdWNpZGUuZGV2L2ljb25zL3RpbWVyXG4gKiBAc2VlIGh0dHBzOi8vbHVjaWRlLmRldi9ndWlkZS9wYWNrYWdlcy9sdWNpZGUtc3ZlbHRlIC0gRG9jdW1lbnRhdGlvblxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIEx1Y2lkZSBpY29ucyBwcm9wcyBhbmQgYW55IHZhbGlkIFNWRyBhdHRyaWJ1dGVcbiAqIEByZXR1cm5zIHtGdW5jdGlvbmFsQ29tcG9uZW50fSBTdmVsdGUgY29tcG9uZW50XG4gKlxuICovXG48L3NjcmlwdD5cblxuPEljb24gbmFtZT1cInRpbWVyXCIgey4uLiQkcHJvcHN9IGljb25Ob2RlPXtpY29uTm9kZX0+XG4gIDxzbG90Lz5cbjwvSWNvbj5cbiIsIjxzY3JpcHQ+LyoqXG4gKiBAbGljZW5zZSBsdWNpZGUtc3ZlbHRlIHYwLjMzMS4wIC0gSVNDXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgSVNDIGxpY2Vuc2UuXG4gKiBTZWUgdGhlIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnO1xuY29uc3QgaWNvbk5vZGUgPSBbW1wicGF0aFwiLCB7IFwiZFwiOiBcIk0zIDZoMThcIiB9XSwgW1wicGF0aFwiLCB7IFwiZFwiOiBcIk0xOSA2djE0YzAgMS0xIDItMiAySDdjLTEgMC0yLTEtMi0yVjZcIiB9XSwgW1wicGF0aFwiLCB7IFwiZFwiOiBcIk04IDZWNGMwLTEgMS0yIDItMmg0YzEgMCAyIDEgMiAydjJcIiB9XSwgW1wibGluZVwiLCB7IFwieDFcIjogXCIxMFwiLCBcIngyXCI6IFwiMTBcIiwgXCJ5MVwiOiBcIjExXCIsIFwieTJcIjogXCIxN1wiIH1dLCBbXCJsaW5lXCIsIHsgXCJ4MVwiOiBcIjE0XCIsIFwieDJcIjogXCIxNFwiLCBcInkxXCI6IFwiMTFcIiwgXCJ5MlwiOiBcIjE3XCIgfV1dO1xuLyoqXG4gKiBAY29tcG9uZW50IEBuYW1lIFRyYXNoMlxuICogQGRlc2NyaXB0aW9uIEx1Y2lkZSBTVkcgaWNvbiBjb21wb25lbnQsIHJlbmRlcnMgU1ZHIEVsZW1lbnQgd2l0aCBjaGlsZHJlbi5cbiAqXG4gKiBAcHJldmlldyAhW2ltZ10oZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lIZHBaSFJvUFNJeU5DSUtJQ0JvWldsbmFIUTlJakkwSWdvZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSUtJQ0JtYVd4c1BTSnViMjVsSWdvZ0lITjBjbTlyWlQwaUl6QXdNQ0lnYzNSNWJHVTlJbUpoWTJ0bmNtOTFibVF0WTI5c2IzSTZJQ05tWm1ZN0lHSnZjbVJsY2kxeVlXUnBkWE02SURKd2VDSUtJQ0J6ZEhKdmEyVXRkMmxrZEdnOUlqSWlDaUFnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lnb2dJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUNqNEtJQ0E4Y0dGMGFDQmtQU0pOTXlBMmFERTRJaUF2UGdvZ0lEeHdZWFJvSUdROUlrMHhPU0EyZGpFMFl6QWdNUzB4SURJdE1pQXlTRGRqTFRFZ01DMHlMVEV0TWkweVZqWWlJQzgrQ2lBZ1BIQmhkR2dnWkQwaVRUZ2dObFkwWXpBdE1TQXhMVElnTWkweWFEUmpNU0F3SURJZ01TQXlJREoyTWlJZ0x6NEtJQ0E4YkdsdVpTQjRNVDBpTVRBaUlIZ3lQU0l4TUNJZ2VURTlJakV4SWlCNU1qMGlNVGNpSUM4K0NpQWdQR3hwYm1VZ2VERTlJakUwSWlCNE1qMGlNVFFpSUhreFBTSXhNU0lnZVRJOUlqRTNJaUF2UGdvOEwzTjJaejRLKSAtIGh0dHBzOi8vbHVjaWRlLmRldi9pY29ucy90cmFzaC0yXG4gKiBAc2VlIGh0dHBzOi8vbHVjaWRlLmRldi9ndWlkZS9wYWNrYWdlcy9sdWNpZGUtc3ZlbHRlIC0gRG9jdW1lbnRhdGlvblxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIEx1Y2lkZSBpY29ucyBwcm9wcyBhbmQgYW55IHZhbGlkIFNWRyBhdHRyaWJ1dGVcbiAqIEByZXR1cm5zIHtGdW5jdGlvbmFsQ29tcG9uZW50fSBTdmVsdGUgY29tcG9uZW50XG4gKlxuICovXG48L3NjcmlwdD5cblxuPEljb24gbmFtZT1cInRyYXNoLTJcIiB7Li4uJCRwcm9wc30gaWNvbk5vZGU9e2ljb25Ob2RlfT5cbiAgPHNsb3QvPlxuPC9JY29uPlxuIiwiaW1wb3J0IHsgY3ViaWNJbk91dCwgbGluZWFyLCBjdWJpY091dCB9IGZyb20gJy4uL2Vhc2luZy9pbmRleC5tanMnO1xuaW1wb3J0IHsgc3BsaXRfY3NzX3VuaXQsIGlzX2Z1bmN0aW9uLCBhc3NpZ24gfSBmcm9tICcuLi9pbnRlcm5hbC9pbmRleC5tanMnO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuXHJcbmZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxuXG5mdW5jdGlvbiBibHVyKG5vZGUsIHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDQwMCwgZWFzaW5nID0gY3ViaWNJbk91dCwgYW1vdW50ID0gNSwgb3BhY2l0eSA9IDAgfSA9IHt9KSB7XG4gICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGNvbnN0IHRhcmdldF9vcGFjaXR5ID0gK3N0eWxlLm9wYWNpdHk7XG4gICAgY29uc3QgZiA9IHN0eWxlLmZpbHRlciA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS5maWx0ZXI7XG4gICAgY29uc3Qgb2QgPSB0YXJnZXRfb3BhY2l0eSAqICgxIC0gb3BhY2l0eSk7XG4gICAgY29uc3QgW3ZhbHVlLCB1bml0XSA9IHNwbGl0X2Nzc191bml0KGFtb3VudCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVsYXksXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBlYXNpbmcsXG4gICAgICAgIGNzczogKF90LCB1KSA9PiBgb3BhY2l0eTogJHt0YXJnZXRfb3BhY2l0eSAtIChvZCAqIHUpfTsgZmlsdGVyOiAke2Z9IGJsdXIoJHt1ICogdmFsdWV9JHt1bml0fSk7YFxuICAgIH07XG59XG5mdW5jdGlvbiBmYWRlKG5vZGUsIHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDQwMCwgZWFzaW5nID0gbGluZWFyIH0gPSB7fSkge1xuICAgIGNvbnN0IG8gPSArZ2V0Q29tcHV0ZWRTdHlsZShub2RlKS5vcGFjaXR5O1xuICAgIHJldHVybiB7XG4gICAgICAgIGRlbGF5LFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZWFzaW5nLFxuICAgICAgICBjc3M6IHQgPT4gYG9wYWNpdHk6ICR7dCAqIG99YFxuICAgIH07XG59XG5mdW5jdGlvbiBmbHkobm9kZSwgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gNDAwLCBlYXNpbmcgPSBjdWJpY091dCwgeCA9IDAsIHkgPSAwLCBvcGFjaXR5ID0gMCB9ID0ge30pIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgY29uc3QgdGFyZ2V0X29wYWNpdHkgPSArc3R5bGUub3BhY2l0eTtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgIGNvbnN0IG9kID0gdGFyZ2V0X29wYWNpdHkgKiAoMSAtIG9wYWNpdHkpO1xuICAgIGNvbnN0IFt4VmFsdWUsIHhVbml0XSA9IHNwbGl0X2Nzc191bml0KHgpO1xuICAgIGNvbnN0IFt5VmFsdWUsIHlVbml0XSA9IHNwbGl0X2Nzc191bml0KHkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGRlbGF5LFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZWFzaW5nLFxuICAgICAgICBjc3M6ICh0LCB1KSA9PiBgXG5cdFx0XHR0cmFuc2Zvcm06ICR7dHJhbnNmb3JtfSB0cmFuc2xhdGUoJHsoMSAtIHQpICogeFZhbHVlfSR7eFVuaXR9LCAkeygxIC0gdCkgKiB5VmFsdWV9JHt5VW5pdH0pO1xuXHRcdFx0b3BhY2l0eTogJHt0YXJnZXRfb3BhY2l0eSAtIChvZCAqIHUpfWBcbiAgICB9O1xufVxuZnVuY3Rpb24gc2xpZGUobm9kZSwgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gNDAwLCBlYXNpbmcgPSBjdWJpY091dCwgYXhpcyA9ICd5JyB9ID0ge30pIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgY29uc3Qgb3BhY2l0eSA9ICtzdHlsZS5vcGFjaXR5O1xuICAgIGNvbnN0IHByaW1hcnlfcHJvcGVydHkgPSBheGlzID09PSAneScgPyAnaGVpZ2h0JyA6ICd3aWR0aCc7XG4gICAgY29uc3QgcHJpbWFyeV9wcm9wZXJ0eV92YWx1ZSA9IHBhcnNlRmxvYXQoc3R5bGVbcHJpbWFyeV9wcm9wZXJ0eV0pO1xuICAgIGNvbnN0IHNlY29uZGFyeV9wcm9wZXJ0aWVzID0gYXhpcyA9PT0gJ3knID8gWyd0b3AnLCAnYm90dG9tJ10gOiBbJ2xlZnQnLCAncmlnaHQnXTtcbiAgICBjb25zdCBjYXBpdGFsaXplZF9zZWNvbmRhcnlfcHJvcGVydGllcyA9IHNlY29uZGFyeV9wcm9wZXJ0aWVzLm1hcCgoZSkgPT4gYCR7ZVswXS50b1VwcGVyQ2FzZSgpfSR7ZS5zbGljZSgxKX1gKTtcbiAgICBjb25zdCBwYWRkaW5nX3N0YXJ0X3ZhbHVlID0gcGFyc2VGbG9hdChzdHlsZVtgcGFkZGluZyR7Y2FwaXRhbGl6ZWRfc2Vjb25kYXJ5X3Byb3BlcnRpZXNbMF19YF0pO1xuICAgIGNvbnN0IHBhZGRpbmdfZW5kX3ZhbHVlID0gcGFyc2VGbG9hdChzdHlsZVtgcGFkZGluZyR7Y2FwaXRhbGl6ZWRfc2Vjb25kYXJ5X3Byb3BlcnRpZXNbMV19YF0pO1xuICAgIGNvbnN0IG1hcmdpbl9zdGFydF92YWx1ZSA9IHBhcnNlRmxvYXQoc3R5bGVbYG1hcmdpbiR7Y2FwaXRhbGl6ZWRfc2Vjb25kYXJ5X3Byb3BlcnRpZXNbMF19YF0pO1xuICAgIGNvbnN0IG1hcmdpbl9lbmRfdmFsdWUgPSBwYXJzZUZsb2F0KHN0eWxlW2BtYXJnaW4ke2NhcGl0YWxpemVkX3NlY29uZGFyeV9wcm9wZXJ0aWVzWzFdfWBdKTtcbiAgICBjb25zdCBib3JkZXJfd2lkdGhfc3RhcnRfdmFsdWUgPSBwYXJzZUZsb2F0KHN0eWxlW2Bib3JkZXIke2NhcGl0YWxpemVkX3NlY29uZGFyeV9wcm9wZXJ0aWVzWzBdfVdpZHRoYF0pO1xuICAgIGNvbnN0IGJvcmRlcl93aWR0aF9lbmRfdmFsdWUgPSBwYXJzZUZsb2F0KHN0eWxlW2Bib3JkZXIke2NhcGl0YWxpemVkX3NlY29uZGFyeV9wcm9wZXJ0aWVzWzFdfVdpZHRoYF0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGRlbGF5LFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZWFzaW5nLFxuICAgICAgICBjc3M6IHQgPT4gJ292ZXJmbG93OiBoaWRkZW47JyArXG4gICAgICAgICAgICBgb3BhY2l0eTogJHtNYXRoLm1pbih0ICogMjAsIDEpICogb3BhY2l0eX07YCArXG4gICAgICAgICAgICBgJHtwcmltYXJ5X3Byb3BlcnR5fTogJHt0ICogcHJpbWFyeV9wcm9wZXJ0eV92YWx1ZX1weDtgICtcbiAgICAgICAgICAgIGBwYWRkaW5nLSR7c2Vjb25kYXJ5X3Byb3BlcnRpZXNbMF19OiAke3QgKiBwYWRkaW5nX3N0YXJ0X3ZhbHVlfXB4O2AgK1xuICAgICAgICAgICAgYHBhZGRpbmctJHtzZWNvbmRhcnlfcHJvcGVydGllc1sxXX06ICR7dCAqIHBhZGRpbmdfZW5kX3ZhbHVlfXB4O2AgK1xuICAgICAgICAgICAgYG1hcmdpbi0ke3NlY29uZGFyeV9wcm9wZXJ0aWVzWzBdfTogJHt0ICogbWFyZ2luX3N0YXJ0X3ZhbHVlfXB4O2AgK1xuICAgICAgICAgICAgYG1hcmdpbi0ke3NlY29uZGFyeV9wcm9wZXJ0aWVzWzFdfTogJHt0ICogbWFyZ2luX2VuZF92YWx1ZX1weDtgICtcbiAgICAgICAgICAgIGBib3JkZXItJHtzZWNvbmRhcnlfcHJvcGVydGllc1swXX0td2lkdGg6ICR7dCAqIGJvcmRlcl93aWR0aF9zdGFydF92YWx1ZX1weDtgICtcbiAgICAgICAgICAgIGBib3JkZXItJHtzZWNvbmRhcnlfcHJvcGVydGllc1sxXX0td2lkdGg6ICR7dCAqIGJvcmRlcl93aWR0aF9lbmRfdmFsdWV9cHg7YFxuICAgIH07XG59XG5mdW5jdGlvbiBzY2FsZShub2RlLCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSA0MDAsIGVhc2luZyA9IGN1YmljT3V0LCBzdGFydCA9IDAsIG9wYWNpdHkgPSAwIH0gPSB7fSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBjb25zdCB0YXJnZXRfb3BhY2l0eSA9ICtzdHlsZS5vcGFjaXR5O1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG4gICAgY29uc3Qgc2QgPSAxIC0gc3RhcnQ7XG4gICAgY29uc3Qgb2QgPSB0YXJnZXRfb3BhY2l0eSAqICgxIC0gb3BhY2l0eSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVsYXksXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBlYXNpbmcsXG4gICAgICAgIGNzczogKF90LCB1KSA9PiBgXG5cdFx0XHR0cmFuc2Zvcm06ICR7dHJhbnNmb3JtfSBzY2FsZSgkezEgLSAoc2QgKiB1KX0pO1xuXHRcdFx0b3BhY2l0eTogJHt0YXJnZXRfb3BhY2l0eSAtIChvZCAqIHUpfVxuXHRcdGBcbiAgICB9O1xufVxuZnVuY3Rpb24gZHJhdyhub2RlLCB7IGRlbGF5ID0gMCwgc3BlZWQsIGR1cmF0aW9uLCBlYXNpbmcgPSBjdWJpY0luT3V0IH0gPSB7fSkge1xuICAgIGxldCBsZW4gPSBub2RlLmdldFRvdGFsTGVuZ3RoKCk7XG4gICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGlmIChzdHlsZS5zdHJva2VMaW5lY2FwICE9PSAnYnV0dCcpIHtcbiAgICAgICAgbGVuICs9IHBhcnNlSW50KHN0eWxlLnN0cm9rZVdpZHRoKTtcbiAgICB9XG4gICAgaWYgKGR1cmF0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHNwZWVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gODAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBsZW4gLyBzcGVlZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbihsZW4pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBkZWxheSxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIGVhc2luZyxcbiAgICAgICAgY3NzOiAoXywgdSkgPT4gYFxuXHRcdFx0c3Ryb2tlLWRhc2hhcnJheTogJHtsZW59O1xuXHRcdFx0c3Ryb2tlLWRhc2hvZmZzZXQ6ICR7dSAqIGxlbn07XG5cdFx0YFxuICAgIH07XG59XG5mdW5jdGlvbiBjcm9zc2ZhZGUoX2EpIHtcbiAgICB2YXIgeyBmYWxsYmFjayB9ID0gX2EsIGRlZmF1bHRzID0gX19yZXN0KF9hLCBbXCJmYWxsYmFja1wiXSk7XG4gICAgY29uc3QgdG9fcmVjZWl2ZSA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCB0b19zZW5kID0gbmV3IE1hcCgpO1xuICAgIGZ1bmN0aW9uIGNyb3NzZmFkZShmcm9tX25vZGUsIG5vZGUsIHBhcmFtcykge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSBkID0+IE1hdGguc3FydChkKSAqIDMwLCBlYXNpbmcgPSBjdWJpY091dCB9ID0gYXNzaWduKGFzc2lnbih7fSwgZGVmYXVsdHMpLCBwYXJhbXMpO1xuICAgICAgICBjb25zdCBmcm9tID0gZnJvbV9ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IGR4ID0gZnJvbS5sZWZ0IC0gdG8ubGVmdDtcbiAgICAgICAgY29uc3QgZHkgPSBmcm9tLnRvcCAtIHRvLnRvcDtcbiAgICAgICAgY29uc3QgZHcgPSBmcm9tLndpZHRoIC8gdG8ud2lkdGg7XG4gICAgICAgIGNvbnN0IGRoID0gZnJvbS5oZWlnaHQgLyB0by5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IGQgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG4gICAgICAgIGNvbnN0IG9wYWNpdHkgPSArc3R5bGUub3BhY2l0eTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRlbGF5LFxuICAgICAgICAgICAgZHVyYXRpb246IGlzX2Z1bmN0aW9uKGR1cmF0aW9uKSA/IGR1cmF0aW9uKGQpIDogZHVyYXRpb24sXG4gICAgICAgICAgICBlYXNpbmcsXG4gICAgICAgICAgICBjc3M6ICh0LCB1KSA9PiBgXG5cdFx0XHRcdG9wYWNpdHk6ICR7dCAqIG9wYWNpdHl9O1xuXHRcdFx0XHR0cmFuc2Zvcm0tb3JpZ2luOiB0b3AgbGVmdDtcblx0XHRcdFx0dHJhbnNmb3JtOiAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7dSAqIGR4fXB4LCR7dSAqIGR5fXB4KSBzY2FsZSgke3QgKyAoMSAtIHQpICogZHd9LCAke3QgKyAoMSAtIHQpICogZGh9KTtcblx0XHRcdGBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihpdGVtcywgY291bnRlcnBhcnRzLCBpbnRybykge1xuICAgICAgICByZXR1cm4gKG5vZGUsIHBhcmFtcykgPT4ge1xuICAgICAgICAgICAgaXRlbXMuc2V0KHBhcmFtcy5rZXksIG5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY291bnRlcnBhcnRzLmhhcyhwYXJhbXMua2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvdGhlcl9ub2RlID0gY291bnRlcnBhcnRzLmdldChwYXJhbXMua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgY291bnRlcnBhcnRzLmRlbGV0ZShwYXJhbXMua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNyb3NzZmFkZShvdGhlcl9ub2RlLCBub2RlLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgbm9kZSBpcyBkaXNhcHBlYXJpbmcgYWx0b2dldGhlclxuICAgICAgICAgICAgICAgIC8vIChpLmUuIHdhc24ndCBjbGFpbWVkIGJ5IHRoZSBvdGhlciBsaXN0KVxuICAgICAgICAgICAgICAgIC8vIHRoZW4gd2UgbmVlZCB0byBzdXBwbHkgYW4gb3V0cm9cbiAgICAgICAgICAgICAgICBpdGVtcy5kZWxldGUocGFyYW1zLmtleSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbGxiYWNrICYmIGZhbGxiYWNrKG5vZGUsIHBhcmFtcywgaW50cm8pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgICAgdHJhbnNpdGlvbih0b19zZW5kLCB0b19yZWNlaXZlLCBmYWxzZSksXG4gICAgICAgIHRyYW5zaXRpb24odG9fcmVjZWl2ZSwgdG9fc2VuZCwgdHJ1ZSlcbiAgICBdO1xufVxuXG5leHBvcnQgeyBibHVyLCBjcm9zc2ZhZGUsIGRyYXcsIGZhZGUsIGZseSwgc2NhbGUsIHNsaWRlIH07XG4iLCIvKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBkZXRlcm1pbmUgaWYgYSBrZXlib2FyZCBhY3Rpb24gY291bnRzIGFzIFwiY2xpY2sgZXF1aXZhbGVudFwiXG4gKiAoaS5lLiBzaG91bGQgYmUgcHJvY2Vzc2VkIGFzIGEgXCJjbGlja1wiIHdoZW4gYW4gZWxlbWVudCBpcyBpbiBmb2N1cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpZkNsaWNrRXF1aXZhbGVudChmbjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQpIHtcbiAgcmV0dXJuIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKFsnRW50ZXInLCAnICddLmNvbnRhaW5zKGUua2V5KSkge1xuICAgICAgZm4oZSlcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIH1cbiAgfVxufVxuIiwiPHNjcmlwdCBsYW5nPVwidHNcIiBjb250ZXh0PVwibW9kdWxlXCI+XG5leHBvcnQgZW51bSBFZGl0TW9kZSB7XG4gIFJlYWQsXG4gIEVkaXRcbn1cblxuPC9zY3JpcHQ+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIsIHRpY2sgfSBmcm9tICdzdmVsdGUnXG5pbXBvcnQgeyBpZkNsaWNrRXF1aXZhbGVudCB9IGZyb20gJy4vdXRpbCdcblxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG5leHBvcnQgbGV0IHZhbHVlOiBzdHJpbmcgPSAnJ1xubGV0IG5ld1ZhbHVlID0gdmFsdWVcbmxldCBmb2N1c1RhcmdldDogSFRNTEVsZW1lbnRcblxuZXhwb3J0IGxldCBtb2RlID0gRWRpdE1vZGUuUmVhZFxuJDogZGlzcGF0Y2goJ21vZGVDaGFuZ2VkJywgeyBtb2RlIH0pXG5cbmZ1bmN0aW9uIHN0YXJ0RWRpdGluZygpIHtcbiAgbW9kZSA9IEVkaXRNb2RlLkVkaXRcbn1cblxuZnVuY3Rpb24gdGFrZUZvY3VzKGVsOiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gIGVsLmZvY3VzKClcbiAgZWwuc2VsZWN0KClcbn1cblxuZnVuY3Rpb24gb25LZXlEb3duKGU6IEtleWJvYXJkRXZlbnQpIHtcbiAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgdmFsdWUgPSBuZXdWYWx1ZSA9IG5ld1ZhbHVlLnRyaW0oKVxuICAgIG1vZGUgPSBFZGl0TW9kZS5SZWFkXG4gICAgZGlzcGF0Y2goJ2NvbmZpcm1lZCcsIHsgdmFsdWUgfSlcbiAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBuZXdWYWx1ZSA9IHZhbHVlXG4gICAgbW9kZSA9IEVkaXRNb2RlLlJlYWRcbiAgICBkaXNwYXRjaCgnY2FuY2VsbGVkJywgeyB2YWx1ZSB9KVxuICB9XG5cbiAgdGljaygpLnRoZW4oKCkgPT4gZm9jdXNUYXJnZXQ/LmZvY3VzKCkpXG59XG48L3NjcmlwdD5cblxueyNpZiBtb2RlID09PSBFZGl0TW9kZS5SZWFkfVxuICA8c3BhblxuICAgIHJvbGU9XCJidXR0b25cIlxuICAgIHRhYmluZGV4PVwiMFwiXG4gICAgYmluZDp0aGlzPXtmb2N1c1RhcmdldH1cbiAgICBvbjpjbGljaz17c3RhcnRFZGl0aW5nfVxuICAgIG9uOmtleWRvd249e2lmQ2xpY2tFcXVpdmFsZW50KHN0YXJ0RWRpdGluZyl9PlxuICAgIHsjaWYgdmFsdWUgPT0gJyd9Jm5ic3A7ey9pZn1cbiAgICB7dmFsdWV9XG4gIDwvc3Bhbj5cbns6ZWxzZX1cbiAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgYmluZDp2YWx1ZT17bmV3VmFsdWV9IHVzZTp0YWtlRm9jdXMgb246a2V5ZG93bj17b25LZXlEb3dufSAvPlxuey9pZn1cbiIsIjxzY3JpcHQgbGFuZz1cInRzXCIgY29udGV4dD1cIm1vZHVsZVwiPlxuZXhwb3J0IGVudW0gRWRpdE1vZGUge1xuICBSZWFkLFxuICBFZGl0XG59XG48L3NjcmlwdD5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgdGljayB9IGZyb20gJ3N2ZWx0ZSdcblxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG5leHBvcnQgbGV0IHZhbHVlOiBudW1iZXIgPSAwXG5sZXQgbmV3VmFsdWUgPSB2YWx1ZS50b1N0cmluZygpXG5sZXQgZm9jdXNUYXJnZXQ6IEhUTUxFbGVtZW50XG5cbmV4cG9ydCBsZXQgbW9kZTogRWRpdE1vZGUgPSBFZGl0TW9kZS5SZWFkXG4kOiBkaXNwYXRjaCgnbW9kZUNoYW5nZWQnLCB7IG1vZGUgfSlcblxuZnVuY3Rpb24gc3RhcnRFZGl0aW5nKCkge1xuICBpZiAoIW5ld1ZhbHVlLnN0YXJ0c1dpdGgoJysnKSAmJiAhbmV3VmFsdWUuc3RhcnRzV2l0aCgnLScpKSB7XG4gICAgbmV3VmFsdWUgPSB2YWx1ZS50b1N0cmluZygpXG4gIH1cblxuICBtb2RlID0gRWRpdE1vZGUuRWRpdFxufVxuXG5mdW5jdGlvbiB0YWtlRm9jdXMoZWw6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgZWwuZm9jdXMoKVxuICBlbC5zZWxlY3QoKVxufVxuXG5mdW5jdGlvbiBvbkVkaXRLZXlEb3duKGU6IEtleWJvYXJkRXZlbnQpIHtcbiAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgbmV3VmFsdWUgPSBuZXdWYWx1ZS50cmltKClcblxuICAgIGlmIChuZXdWYWx1ZS5zdGFydHNXaXRoKCcrJykgfHwgbmV3VmFsdWUuc3RhcnRzV2l0aCgnLScpKSB7XG4gICAgICAvLyBUT0RPOiBTdXBwb3J0IHNpbXBsZSBtYXRoLCBub3QganVzdCBsZWFkaW5nICsvLVxuICAgICAgdmFsdWUgKz0gTnVtYmVyKG5ld1ZhbHVlKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcihuZXdWYWx1ZSlcbiAgICB9XG5cbiAgICBtb2RlID0gRWRpdE1vZGUuUmVhZFxuICAgIGRpc3BhdGNoKCdjb25maXJtZWQnLCB7IHZhbHVlIH0pXG4gIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgbW9kZSA9IEVkaXRNb2RlLlJlYWRcbiAgICBkaXNwYXRjaCgnY2FuY2VsbGVkJywgeyB2YWx1ZSB9KVxuICB9XG5cbiAgdGljaygpLnRoZW4oKCkgPT4gZm9jdXNUYXJnZXQ/LmZvY3VzKCkpXG59XG5cbmZ1bmN0aW9uIG9uU3BhbktleURvd24oZTogS2V5Ym9hcmRFdmVudCkge1xuICBpZiAoWydFbnRlcicsICcgJ10uY29udGFpbnMoZS5rZXkpKSB7XG4gICAgc3RhcnRFZGl0aW5nKClcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfSBlbHNlIGlmIChbJ0Fycm93VXAnLCAnQXJyb3dSaWdodCddLmNvbnRhaW5zKGUua2V5KSkge1xuICAgIHZhbHVlICs9IDFcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfSBlbHNlIGlmIChbJ0Fycm93RG93bicsICdBcnJvd0xlZnQnXS5jb250YWlucyhlLmtleSkpIHtcbiAgICB2YWx1ZSAtPSAxXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG57I2lmIG1vZGUgPT09IEVkaXRNb2RlLlJlYWR9XG4gIDxzcGFuXG4gICAgcm9sZT1cImJ1dHRvblwiXG4gICAgdGFiaW5kZXg9XCIwXCJcbiAgICBiaW5kOnRoaXM9e2ZvY3VzVGFyZ2V0fVxuICAgIG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXtzdGFydEVkaXRpbmd9XG4gICAgb246a2V5ZG93bj17b25TcGFuS2V5RG93bn0+XG4gICAge3ZhbHVlfVxuICA8L3NwYW4+XG57OmVsc2V9XG4gIDxpbnB1dCB0eXBlPVwidGV4dFwiIGJpbmQ6dmFsdWU9e25ld1ZhbHVlfSB1c2U6dGFrZUZvY3VzIG9uOmtleWRvd249e29uRWRpdEtleURvd259IC8+XG57L2lmfVxuIiwiPHNjcmlwdCB0eXBlPVwidHNcIj5cbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbmltcG9ydCB7IEFycm93VXBGcm9tTGluZSwgQXJyb3dEb3duRnJvbUxpbmUsIE1pbnVzU3F1YXJlLCBQbHVzU3F1YXJlIH0gZnJvbSAnbHVjaWRlLXN2ZWx0ZSdcbmltcG9ydCB7IGlmQ2xpY2tFcXVpdmFsZW50IH0gZnJvbSAnLi91dGlsJ1xuXG5leHBvcnQgbGV0IHNlZ21lbnRzOiBudW1iZXIgPSA0XG5leHBvcnQgbGV0IGZpbGxlZDogbnVtYmVyID0gMFxuXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiQ6IGRpc3BhdGNoKCd1cGRhdGVkJywgeyBzZWdtZW50cywgZmlsbGVkIH0pXG5cbiQ6IGZpbGxDaXJjbGUgPSBzZWdtZW50cyA8PSAxID8gZmlsbGVkID49IDEgOiBudWxsXG4kOiBzZWdtZW50cyA9IE1hdGgubWF4KDEsIHNlZ21lbnRzKVxuJDogZmlsbGVkID0gZmlsbGVkIDwgMCA/IHNlZ21lbnRzIDogZmlsbGVkXG4kOiBmaWxsZWQgPSBmaWxsZWQgPiBzZWdtZW50cyA/IDAgOiBmaWxsZWRcblxuY29uc3QgcmFkaXVzID0gNTBcbmNvbnN0IHBhZGRpbmcgPSA0XG5cbmZ1bmN0aW9uIHNsaWNlcyhzZWdtZW50czogbnVtYmVyLCBmaWxsZWQ6IG51bWJlcikge1xuICBjb25zdCBzcyA9IFtdXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50czsgKytpKSB7XG4gICAgY29uc3QgeDEgPSByYWRpdXMgKiBNYXRoLnNpbigoMiAqIE1hdGguUEkgKiBpKSAvIHNlZ21lbnRzKSArIHJhZGl1cyArIHBhZGRpbmdcbiAgICBjb25zdCB4MiA9IHJhZGl1cyAqIE1hdGguc2luKCgyICogTWF0aC5QSSAqIChpICsgMSkpIC8gc2VnbWVudHMpICsgcmFkaXVzICsgcGFkZGluZ1xuXG4gICAgY29uc3QgeTEgPSAtcmFkaXVzICogTWF0aC5jb3MoKDIgKiBNYXRoLlBJICogaSkgLyBzZWdtZW50cykgKyByYWRpdXMgKyBwYWRkaW5nXG4gICAgY29uc3QgeTIgPSAtcmFkaXVzICogTWF0aC5jb3MoKDIgKiBNYXRoLlBJICogKGkgKyAxKSkgLyBzZWdtZW50cykgKyByYWRpdXMgKyBwYWRkaW5nXG5cbiAgICBzcy5wdXNoKHtcbiAgICAgIHgxLFxuICAgICAgeDIsXG4gICAgICB5MSxcbiAgICAgIHkyLFxuICAgICAgaXNGaWxsZWQ6IGkgPCBmaWxsZWRcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHNzXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUluY3JlbWVudChlOiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCkge1xuICBpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkge1xuICAgIHNlZ21lbnRzICs9IDFcbiAgfSBlbHNlIHtcbiAgICBmaWxsZWQgKz0gMVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZURlY3JlbWVudChlOiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCkge1xuICBpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkge1xuICAgIHNlZ21lbnRzIC09IDFcbiAgICBmaWxsZWQgPSBNYXRoLm1pbihzZWdtZW50cywgZmlsbGVkKVxuICB9IGVsc2Uge1xuICAgIGZpbGxlZCAtPSAxXG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlQ2xvY2tLZXlJbnRlcmFjdGlvbihlOiBLZXlib2FyZEV2ZW50KSB7XG4gIGlmIChbJ0VudGVyJywgJyAnLCAnQXJyb3dVcCcsICdBcnJvd1JpZ2h0J10uY29udGFpbnMoZS5rZXkpKSB7XG4gICAgaWYgKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpIHtcbiAgICAgIHNlZ21lbnRzICs9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsbGVkICs9IDFcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfSBlbHNlIGlmIChbJ0Fycm93RG93bicsICdBcnJvd0xlZnQnXS5jb250YWlucyhlLmtleSkpIHtcbiAgICBpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkge1xuICAgICAgc2VnbWVudHMgLT0gMVxuICAgICAgZmlsbGVkID0gTWF0aC5taW4oc2VnbWVudHMsIGZpbGxlZClcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsbGVkIC09IDFcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3MtY2xvY2tcIj5cbiAgPHN2Z1xuICAgIGRhdGEtc2VnbWVudHM9e3NlZ21lbnRzfVxuICAgIGRhdGEtZmlsbGVkPXtmaWxsZWR9XG4gICAgcm9sZT1cImJ1dHRvblwiXG4gICAgdGFiaW5kZXg9XCIwXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICB2aWV3Qm94PVwiMCAwIHsyICogcmFkaXVzICsgMiAqIHBhZGRpbmd9IHsyICogcmFkaXVzICsgMiAqIHBhZGRpbmd9XCJcbiAgICBvbjpjbGlja3xwcmV2ZW50RGVmYXVsdD17aGFuZGxlSW5jcmVtZW50fVxuICAgIG9uOmNvbnRleHRtZW51fHByZXZlbnREZWZhdWx0PXtoYW5kbGVEZWNyZW1lbnR9XG4gICAgb246a2V5ZG93bj17aGFuZGxlQ2xvY2tLZXlJbnRlcmFjdGlvbn0+XG4gICAgeyNpZiBzZWdtZW50cyA+IDF9XG4gICAgICB7I2VhY2ggc2xpY2VzKHNlZ21lbnRzLCBmaWxsZWQpIGFzIHsgeDEsIHgyLCB5MSwgeTIsIGlzRmlsbGVkIH0sIGl9XG4gICAgICAgIDxwYXRoXG4gICAgICAgICAgZGF0YS1zZWdtZW50PXtpfVxuICAgICAgICAgIGRhdGEtZmlsbGVkPXtpc0ZpbGxlZH1cbiAgICAgICAgICBkPVwiXG4gICAgICAgIE0ge3JhZGl1cyArIHBhZGRpbmd9IHtyYWRpdXMgKyBwYWRkaW5nfVxuICAgICAgICBMIHt4MX0ge3kxfVxuICAgICAgICBBIHtyYWRpdXN9IHtyYWRpdXN9IDAgMCAxIHt4Mn0ge3kyfVxuICAgICAgICBaXCIgLz5cbiAgICAgIHsvZWFjaH1cbiAgICB7L2lmfVxuICAgIDxjaXJjbGUgY3g9e3JhZGl1cyArIHBhZGRpbmd9IGN5PXtyYWRpdXMgKyBwYWRkaW5nfSByPXtyYWRpdXN9IGRhdGEtZmlsbGVkPXtmaWxsQ2lyY2xlfSAvPlxuICA8L3N2Zz5cbiAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1jbG9ja19fYnV0dG9uc1wiPlxuICAgIDxidXR0b25cbiAgICAgIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLWNsb2NrX19kZWNyZW1lbnRcIlxuICAgICAgdGl0bGU9XCJVbmZpbGwgb25lIHNlZ21lbnRcIlxuICAgICAgb246Y2xpY2t8cHJldmVudERlZmF1bHQ9e2hhbmRsZURlY3JlbWVudH1cbiAgICAgIG9uOmtleWRvd249e2lmQ2xpY2tFcXVpdmFsZW50KGhhbmRsZURlY3JlbWVudCl9PlxuICAgICAgPE1pbnVzU3F1YXJlIC8+XG4gICAgPC9idXR0b24+XG4gICAgPGJ1dHRvblxuICAgICAgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3MtY2xvY2tfX2luY3JlbWVudFwiXG4gICAgICB0aXRsZT1cIkZpbGwgb25lIHNlZ21lbnRcIlxuICAgICAgb246Y2xpY2t8cHJldmVudERlZmF1bHQ9e2hhbmRsZUluY3JlbWVudH1cbiAgICAgIG9uOmtleWRvd249e2lmQ2xpY2tFcXVpdmFsZW50KGhhbmRsZUluY3JlbWVudCl9PlxuICAgICAgPFBsdXNTcXVhcmUgLz5cbiAgICA8L2J1dHRvbj5cbiAgICA8YnV0dG9uXG4gICAgICBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1jbG9ja19fZGVjcmVtZW50LXNlZ21lbnRzXCJcbiAgICAgIHRpdGxlPVwiUmVtb3ZlIG9uZSBzZWdtZW50XCJcbiAgICAgIG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXsoKSA9PiAoc2VnbWVudHMgLT0gMSl9XG4gICAgICBvbjprZXlkb3duPXtpZkNsaWNrRXF1aXZhbGVudCgoKSA9PiAoc2VnbWVudHMgLT0gMSkpfT5cbiAgICAgIDxBcnJvd0Rvd25Gcm9tTGluZSAvPlxuICAgIDwvYnV0dG9uPlxuICAgIDxidXR0b25cbiAgICAgIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLWNsb2NrX19pbmNyZW1lbnQtc2VnbWVudHNcIlxuICAgICAgdGl0bGU9XCJBZGQgYW5vdGhlciBzZWdtZW50XCJcbiAgICAgIG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXsoKSA9PiAoc2VnbWVudHMgKz0gMSl9XG4gICAgICBvbjprZXlkb3duPXtpZkNsaWNrRXF1aXZhbGVudCgoKSA9PiAoc2VnbWVudHMgKz0gMSkpfT5cbiAgICAgIDxBcnJvd1VwRnJvbUxpbmUgLz5cbiAgICA8L2J1dHRvbj5cbiAgPC9kaXY+XG48L2Rpdj5cbiIsIjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBNaW51c1NxdWFyZSwgUGx1c1NxdWFyZSB9IGZyb20gJ2x1Y2lkZS1zdmVsdGUnXG5pbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG5cbmltcG9ydCBFZGl0YWJsZU51bWJlciBmcm9tICcuL0VkaXRhYmxlTnVtYmVyLnN2ZWx0ZSdcbmltcG9ydCB7IGlmQ2xpY2tFcXVpdmFsZW50IH0gZnJvbSAnLi91dGlsJ1xuXG5leHBvcnQgbGV0IHZhbHVlID0gMFxuXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiQ6IGRpc3BhdGNoKCd1cGRhdGVkJywgeyB2YWx1ZSB9KVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50KCkge1xuICB2YWx1ZSArPSAxXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNyZW1lbnQoKSB7XG4gIHZhbHVlIC09IDFcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLWNvdW50ZXJcIj5cbiAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1jb3VudGVyX192YWx1ZVwiPlxuICAgIDxFZGl0YWJsZU51bWJlciBiaW5kOnZhbHVlIC8+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLWNvdW50ZXJfX2J1dHRvbnNcIj5cbiAgICA8ZGl2XG4gICAgICByb2xlPVwiYnV0dG9uXCJcbiAgICAgIHRhYmluZGV4PVwiMFwiXG4gICAgICBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1idXR0b24gcHJvZ3Jlc3MtY2xvY2tzLWNvdW50ZXJfX2RlY3JlbWVudFwiXG4gICAgICBvbjpjbGlja3xwcmV2ZW50RGVmYXVsdD17ZGVjcmVtZW50fVxuICAgICAgb246a2V5ZG93bj17aWZDbGlja0VxdWl2YWxlbnQoZGVjcmVtZW50KX0+XG4gICAgICA8TWludXNTcXVhcmUgLz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2XG4gICAgICByb2xlPVwiYnV0dG9uXCJcbiAgICAgIHRhYmluZGV4PVwiMFwiXG4gICAgICBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1idXR0b24gcHJvZ3Jlc3MtY2xvY2tzLWNvdW50ZXJfX2luY3JlbWVudFwiXG4gICAgICBvbjpjbGlja3xwcmV2ZW50RGVmYXVsdD17aW5jcmVtZW50fVxuICAgICAgb246a2V5ZG93bj17aWZDbGlja0VxdWl2YWxlbnQoaW5jcmVtZW50KX0+XG4gICAgICA8UGx1c1NxdWFyZSAvPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuIiwiPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgb25EZXN0cm95LCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuaW1wb3J0IHsgUGF1c2UsIFBsYXksIFJlZnJlc2hDY3csIFRpbWVyIH0gZnJvbSAnbHVjaWRlLXN2ZWx0ZSdcbmltcG9ydCB7IGlmQ2xpY2tFcXVpdmFsZW50IH0gZnJvbSAnLi91dGlsJ1xuXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5jb25zdCBsb2NhbGUgPSBJbnRsLk51bWJlckZvcm1hdCgpLnJlc29sdmVkT3B0aW9ucygpLmxvY2FsZVxuXG5leHBvcnQgbGV0IHN0YXJ0TWlsbGlzOiBudW1iZXIgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuZXhwb3J0IGxldCBvZmZzZXRNaWxsaXM6IG51bWJlciA9IDBcbmV4cG9ydCBsZXQgc2hvd01pbGxpczogYm9vbGVhbiA9IGZhbHNlXG5leHBvcnQgbGV0IGlzUnVubmluZzogYm9vbGVhbiA9IHRydWVcbmV4cG9ydCBsZXQgbGFwVGltZXM6IG51bWJlcltdID0gW11cblxuY29uc3QgVElDS19JTlRFUlZBTF9NUyA9IDEwXG5cbmxldCBlbGFwc2VkTXMgPSAwXG5sZXQgdGlja0ludGVydmFsOiBudW1iZXIgfCBudWxsID0gbnVsbFxuXG5mdW5jdGlvbiB0aWNrKCkge1xuICBlbGFwc2VkTXMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0TWlsbGlzICsgb2Zmc2V0TWlsbGlzXG59XG5cbm9uTW91bnQoKCkgPT4ge1xuICBpZiAoaXNSdW5uaW5nKSB7XG4gICAgdGljaygpXG4gICAgc3RhcnQoKVxuICB9IGVsc2Uge1xuICAgIGVsYXBzZWRNcyA9IG9mZnNldE1pbGxpc1xuICB9XG59KVxuXG5vbkRlc3Ryb3koKCkgPT4ge1xuICBpZiAodGlja0ludGVydmFsKSB7XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGlja0ludGVydmFsKVxuICAgIHRpY2tJbnRlcnZhbCA9IG51bGxcbiAgfVxufSlcblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0KCkge1xuICBpZiAodGlja0ludGVydmFsKSB7XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGlja0ludGVydmFsKVxuICAgIHRpY2tJbnRlcnZhbCA9IG51bGxcbiAgfVxuXG4gIG9mZnNldE1pbGxpcyA9IGVsYXBzZWRNc1xuICBzdGFydE1pbGxpcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gIHRpY2tJbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCh0aWNrLCBUSUNLX0lOVEVSVkFMX01TKVxuICBpc1J1bm5pbmcgPSB0cnVlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wKCkge1xuICBpZiAodGlja0ludGVydmFsKSB7XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGlja0ludGVydmFsKVxuICAgIHRpY2tJbnRlcnZhbCA9IG51bGxcbiAgfVxuXG4gIG9mZnNldE1pbGxpcyA9IGVsYXBzZWRNc1xuICBpc1J1bm5pbmcgPSBmYWxzZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXQoKSB7XG4gIHN0YXJ0TWlsbGlzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgb2Zmc2V0TWlsbGlzID0gMFxuICBsYXBUaW1lcyA9IFtdXG4gIGVsYXBzZWRNcyA9IDBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZVByZWNpc2lvbigpIHtcbiAgc2hvd01pbGxpcyA9ICFzaG93TWlsbGlzXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXAoKSB7XG4gIGxhcFRpbWVzLnB1c2goZWxhcHNlZE1zKVxuICBsYXBUaW1lcyA9IGxhcFRpbWVzXG4gIGRpc3BhdGNoKCdsYXAnLCB7IGVsYXBzZWRNcyB9KVxufVxuXG5mdW5jdGlvbiBmb3JtYXRUaW1lKG1zOiBudW1iZXIsIHNob3dNaWxsaXM6IGJvb2xlYW4gPSBmYWxzZSkge1xuICBjb25zdCBzZWNvbmRzID0gc2hvd01pbGxpcyA/IChtcyAvIDEwMDApICUgNjAgOiBNYXRoLmZsb29yKG1zIC8gMTAwMCkgJSA2MFxuICBjb25zdCBzZWNvbmRzRm9ybWF0dGVkID0gSW50bC5OdW1iZXJGb3JtYXQobG9jYWxlLCB7XG4gICAgc3R5bGU6ICdkZWNpbWFsJyxcbiAgICBtaW5pbXVtSW50ZWdlckRpZ2l0czogMixcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IHNob3dNaWxsaXMgPyAzIDogMFxuICB9KS5mb3JtYXQoc2Vjb25kcylcblxuICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcihtcyAvIDEwMDAgLyA2MCkgJSA2MFxuICBjb25zdCBtaW51dGVzRm9ybWF0dGVkID0gSW50bC5OdW1iZXJGb3JtYXQobG9jYWxlLCB7XG4gICAgc3R5bGU6ICdkZWNpbWFsJyxcbiAgICBtaW5pbXVtSW50ZWdlckRpZ2l0czogMlxuICB9KS5mb3JtYXQobWludXRlcylcblxuICBjb25zdCBob3VycyA9IE1hdGguZmxvb3IobXMgLyAxMDAwIC8gNjAgLyA2MClcbiAgY29uc3QgaG91cnNGb3JtYXR0ZWQgPSBJbnRsLk51bWJlckZvcm1hdChsb2NhbGUsIHtcbiAgICBzdHlsZTogJ2RlY2ltYWwnLFxuICAgIG1pbmltdW1JbnRlZ2VyRGlnaXRzOiAyXG4gIH0pLmZvcm1hdChob3VycylcblxuICByZXR1cm4gaG91cnMgPiAwXG4gICAgPyBgJHtob3Vyc0Zvcm1hdHRlZH06JHttaW51dGVzRm9ybWF0dGVkfToke3NlY29uZHNGb3JtYXR0ZWR9YFxuICAgIDogYCR7bWludXRlc0Zvcm1hdHRlZH06JHtzZWNvbmRzRm9ybWF0dGVkfWBcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXN0b3B3YXRjaFwiPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3Mtc3RvcHdhdGNoX19lbGFwc2VkXCJcbiAgICByb2xlPVwiYnV0dG9uXCJcbiAgICB0YWJpbmRleD1cIjBcIlxuICAgIG9uOmNsaWNrPXt0b2dnbGVQcmVjaXNpb259XG4gICAgb246a2V5ZG93bj17aWZDbGlja0VxdWl2YWxlbnQodG9nZ2xlUHJlY2lzaW9uKX0+XG4gICAge2Zvcm1hdFRpbWUoZWxhcHNlZE1zLCBzaG93TWlsbGlzKX1cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3Mtc3RvcHdhdGNoX19idXR0b25zXCI+XG4gICAgPGJ1dHRvbiBvbjpjbGljaz17KCkgPT4gKGlzUnVubmluZyA/IHN0b3AoKSA6IHN0YXJ0KCkpfT5cbiAgICAgIHsjaWYgaXNSdW5uaW5nfVxuICAgICAgICA8UGF1c2UgLz5cbiAgICAgIHs6ZWxzZX1cbiAgICAgICAgPFBsYXkgLz5cbiAgICAgIHsvaWZ9XG4gICAgPC9idXR0b24+XG4gICAgPGJ1dHRvbiBvbjpjbGljaz17cmVzZXR9PlxuICAgICAgPFJlZnJlc2hDY3cgLz5cbiAgICA8L2J1dHRvbj5cbiAgICA8YnV0dG9uIG9uOmNsaWNrPXtsYXB9PlxuICAgICAgPFRpbWVyIC8+XG4gICAgPC9idXR0b24+XG4gICAgPGJ1dHRvbiBvbjpjbGljaz17KCkgPT4gKHNob3dNaWxsaXMgPSAhc2hvd01pbGxpcyl9PiAvMTAwMCA8L2J1dHRvbj5cbiAgPC9kaXY+XG4gIHsjaWYgbGFwVGltZXMubGVuZ3RoID4gMH1cbiAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXN0b3B3YXRjaF9fbGFwc1wiPlxuICAgICAgeyNlYWNoIGxhcFRpbWVzIGFzIGxhcFRpbWUsIGl9XG4gICAgICAgIDxkaXYgZGF0YS1sYXAtdGltZS1tcz17bGFwVGltZX0+KHtpICsgMX0pIHtmb3JtYXRUaW1lKGxhcFRpbWUsIHNob3dNaWxsaXMpfTwvZGl2PlxuICAgICAgey9lYWNofVxuICAgIDwvZGl2PlxuICB7L2lmfVxuPC9kaXY+XG4iLCI8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgUGllQ2hhcnQsIFBsdXNTcXVhcmUsIFRpbWVyLCBUcmFzaDIgfSBmcm9tICdsdWNpZGUtc3ZlbHRlJ1xuaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCB0aWNrIH0gZnJvbSAnc3ZlbHRlJ1xuaW1wb3J0IHsgZmFkZSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJ1xuXG5pbXBvcnQgRWRpdGFibGVUZXh0IGZyb20gJy4vRWRpdGFibGVUZXh0LnN2ZWx0ZSdcbmltcG9ydCBFZGl0YWJsZU51bWJlciwgeyBFZGl0TW9kZSB9IGZyb20gJy4vRWRpdGFibGVOdW1iZXIuc3ZlbHRlJ1xuaW1wb3J0IENsb2NrIGZyb20gJy4vQ2xvY2suc3ZlbHRlJ1xuaW1wb3J0IENvdW50ZXIgZnJvbSAnLi9Db3VudGVyLnN2ZWx0ZSdcbmltcG9ydCBTdG9wV2F0Y2ggZnJvbSAnLi9TdG9wV2F0Y2guc3ZlbHRlJ1xuXG5pbXBvcnQgdHlwZSB7IFNlY3Rpb25DaGlsZCB9IGZyb20gJ3NyYy9TdGF0ZSdcbmltcG9ydCB7IGlmQ2xpY2tFcXVpdmFsZW50IH0gZnJvbSAnLi91dGlsJ1xuXG5leHBvcnQgbGV0IG5hbWU6IHN0cmluZ1xuZXhwb3J0IGxldCBjaGlsZHJlbjogU2VjdGlvbkNoaWxkW11cblxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG5mdW5jdGlvbiByYWlzZVJlbW92ZVNlY3Rpb24oZTogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpIHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBNb3VzZUV2ZW50IHx8IFsnRW50ZXInLCAnICddLmNvbnRhaW5zKGUua2V5KSkge1xuICAgIGRpc3BhdGNoKCdyZW1vdmVTZWN0aW9uJywgeyBzZWxmOiB0aGlzIH0pXG4gIH1cbn1cblxubGV0IGFkZGluZ0Nsb2NrID0gZmFsc2VcbmxldCBuZXdDbG9ja01vZGUgPSBFZGl0TW9kZS5FZGl0XG5sZXQgbmV3Q2xvY2tTZWdtZW50cyA9IDRcblxuZnVuY3Rpb24gYWRkQ2xvY2soKSB7XG4gIGlmIChuZXdDbG9ja01vZGUgIT09IEVkaXRNb2RlLlJlYWQpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmIChuZXdDbG9ja1NlZ21lbnRzIDwgMSkge1xuICAgIHRpY2soKS50aGVuKCgpID0+IHtcbiAgICAgIG5ld0Nsb2NrTW9kZSA9IEVkaXRNb2RlLkVkaXRcbiAgICB9KVxuICAgIHJldHVyblxuICB9XG5cbiAgY2hpbGRyZW4ucHVzaCh7XG4gICAgdHlwZTogJ2Nsb2NrJyxcbiAgICBuYW1lOiBgQ2xvY2sgJHtjaGlsZHJlbi5sZW5ndGggKyAxfWAsXG4gICAgc2VnbWVudHM6IG5ld0Nsb2NrU2VnbWVudHMsXG4gICAgZmlsbGVkOiAwXG4gIH0pXG5cbiAgYWRkaW5nQ2xvY2sgPSBmYWxzZVxuICBuZXdDbG9ja01vZGUgPSBFZGl0TW9kZS5FZGl0XG5cbiAgY2hpbGRyZW4gPSBjaGlsZHJlblxufVxuXG5mdW5jdGlvbiBhZGRDb3VudGVyKCkge1xuICBjaGlsZHJlbi5wdXNoKHtcbiAgICB0eXBlOiAnY291bnRlcicsXG4gICAgbmFtZTogYENvdW50ZXIgJHtjaGlsZHJlbi5sZW5ndGggKyAxfWAsXG4gICAgdmFsdWU6IDBcbiAgfSlcblxuICBjaGlsZHJlbiA9IGNoaWxkcmVuXG59XG5cbmZ1bmN0aW9uIGFkZFN0b3B3YXRjaCgpIHtcbiAgY2hpbGRyZW4ucHVzaCh7XG4gICAgdHlwZTogJ3N0b3B3YXRjaCcsXG4gICAgbmFtZTogYFN0b3B3YXRjaCAke2NoaWxkcmVuLmxlbmd0aCArIDF9YCxcbiAgICBzdGFydE1pbGxpczogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgb2Zmc2V0TWlsbGlzOiAwLFxuICAgIHNob3dNaWxsaXM6IGZhbHNlLFxuICAgIGlzUnVubmluZzogdHJ1ZSxcbiAgICBsYXBUaW1lczogW11cbiAgfSlcblxuICBjaGlsZHJlbiA9IGNoaWxkcmVuXG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNoaWxkKGk6IG51bWJlcikge1xuICBjaGlsZHJlbi5zcGxpY2UoaSwgMSlcbiAgY2hpbGRyZW4gPSBjaGlsZHJlblxufVxuPC9zY3JpcHQ+XG5cbjxzZWN0aW9uIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXNlY3Rpb25cIiB0cmFuc2l0aW9uOmZhZGU9e3sgZHVyYXRpb246IDEwMCB9fT5cbiAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1zZWN0aW9uX19uYW1lXCI+XG4gICAgPEVkaXRhYmxlVGV4dCBiaW5kOnZhbHVlPXtuYW1lfSAvPlxuICA8L2Rpdj5cblxuICA8ZGl2XG4gICAgcm9sZT1cImJ1dHRvblwiXG4gICAgdGFiaW5kZXg9XCIwXCJcbiAgICBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1idXR0b24gcHJvZ3Jlc3MtY2xvY2tzLXNlY3Rpb25fX3JlbW92ZVwiXG4gICAgb246Y2xpY2s9e3JhaXNlUmVtb3ZlU2VjdGlvbn1cbiAgICBvbjpjb250ZXh0bWVudT17cmFpc2VSZW1vdmVTZWN0aW9ufVxuICAgIG9uOmtleWRvd249e3JhaXNlUmVtb3ZlU2VjdGlvbn0+XG4gICAgPFRyYXNoMiAvPlxuICA8L2Rpdj5cblxuICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXNlY3Rpb25fX2NoaWxkcmVuXCI+XG4gICAgeyNlYWNoIGNoaWxkcmVuIGFzIGNoaWxkLCBpfVxuICAgICAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1zZWN0aW9uX19jaGlsZFwiIGRhdGEtY2hpbGQtdHlwZT17Y2hpbGQudHlwZX0+XG4gICAgICAgIHsjaWYgY2hpbGQudHlwZSA9PT0gJ2Nsb2NrJ31cbiAgICAgICAgICA8Q2xvY2sgey4uLmNoaWxkfSBiaW5kOnNlZ21lbnRzPXtjaGlsZC5zZWdtZW50c30gYmluZDpmaWxsZWQ9e2NoaWxkLmZpbGxlZH0gLz5cbiAgICAgICAgezplbHNlIGlmIGNoaWxkLnR5cGUgPT09ICdjb3VudGVyJ31cbiAgICAgICAgICA8Q291bnRlciB7Li4uY2hpbGR9IGJpbmQ6dmFsdWU9e2NoaWxkLnZhbHVlfSAvPlxuICAgICAgICB7OmVsc2UgaWYgY2hpbGQudHlwZSA9PT0gJ3N0b3B3YXRjaCd9XG4gICAgICAgICAgPFN0b3BXYXRjaFxuICAgICAgICAgICAgey4uLmNoaWxkfVxuICAgICAgICAgICAgYmluZDpzdGFydE1pbGxpcz17Y2hpbGQuc3RhcnRNaWxsaXN9XG4gICAgICAgICAgICBiaW5kOm9mZnNldE1pbGxpcz17Y2hpbGQub2Zmc2V0TWlsbGlzfVxuICAgICAgICAgICAgYmluZDpzaG93TWlsbGlzPXtjaGlsZC5zaG93TWlsbGlzfVxuICAgICAgICAgICAgYmluZDppc1J1bm5pbmc9e2NoaWxkLmlzUnVubmluZ31cbiAgICAgICAgICAgIGJpbmQ6bGFwVGltZXM9e2NoaWxkLmxhcFRpbWVzfSAvPlxuICAgICAgICB7L2lmfVxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3Mtc2VjdGlvbl9fY2hpbGQtbmFtZVwiPlxuICAgICAgICAgIDxFZGl0YWJsZVRleHQgYmluZDp2YWx1ZT17Y2hpbGQubmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1zZWN0aW9uX19yZW1vdmUtY2hpbGRcIj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICByb2xlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIHRhYmluZGV4PVwiMFwiXG4gICAgICAgICAgICBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1idXR0b24gcHJvZ3Jlc3MtY2xvY2tzLXNlY3Rpb25fX3JlbW92ZS1jaGlsZFwiXG4gICAgICAgICAgICBvbjpjbGljaz17KCkgPT4gcmVtb3ZlQ2hpbGQoaSl9XG4gICAgICAgICAgICBvbjprZXlkb3duPXtpZkNsaWNrRXF1aXZhbGVudCgoKSA9PiByZW1vdmVDaGlsZChpKSl9PlxuICAgICAgICAgICAgPFRyYXNoMiAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIHsvZWFjaH1cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3Mtc2VjdGlvbl9fYWRkLWNoaWxkXCI+XG4gICAgeyNpZiBhZGRpbmdDbG9ja31cbiAgICAgIDxFZGl0YWJsZU51bWJlclxuICAgICAgICBiaW5kOm1vZGU9e25ld0Nsb2NrTW9kZX1cbiAgICAgICAgYmluZDp2YWx1ZT17bmV3Q2xvY2tTZWdtZW50c31cbiAgICAgICAgb246Y29uZmlybWVkPXthZGRDbG9ja31cbiAgICAgICAgb246Y2FuY2VsbGVkPXsoKSA9PiB7XG4gICAgICAgICAgYWRkaW5nQ2xvY2sgPSBmYWxzZVxuICAgICAgICAgIG5ld0Nsb2NrTW9kZSA9IEVkaXRNb2RlLkVkaXRcbiAgICAgICAgfX0gLz5cbiAgICB7OmVsc2V9XG4gICAgICA8YnV0dG9uXG4gICAgICAgIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXNlY3Rpb25fX2FkZC1jbG9ja1wiXG4gICAgICAgIHRpdGxlPVwiQWRkIG5ldyBwcm9ncmVzcyBjbG9ja1wiXG4gICAgICAgIG9uOmNsaWNrPXsoKSA9PiAoYWRkaW5nQ2xvY2sgPSB0cnVlKX0+XG4gICAgICAgIDxQaWVDaGFydCAvPlxuICAgICAgPC9idXR0b24+XG4gICAgey9pZn1cbiAgICA8YnV0dG9uIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXNlY3Rpb25fX2FkZC1jb3VudGVyXCIgdGl0bGU9XCJBZGQgbmV3IGNvdW50ZXJcIiBvbjpjbGljaz17YWRkQ291bnRlcn0+XG4gICAgICA8UGx1c1NxdWFyZSAvPlxuICAgIDwvYnV0dG9uPlxuICAgIDxidXR0b24gY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3Mtc2VjdGlvbl9fYWRkLXN0b3B3YXRjaFwiIHRpdGxlPVwiQWRkIG5ldyBzdG9wd2F0Y2hcIiBvbjpjbGljaz17YWRkU3RvcHdhdGNofT5cbiAgICAgIDxUaW1lciAvPlxuICAgIDwvYnV0dG9uPlxuICA8L2Rpdj5cbjwvc2VjdGlvbj5cbiIsIjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG5cbmltcG9ydCBTdGF0ZSBmcm9tICcuLi9TdGF0ZSdcbmltcG9ydCBTZWN0aW9uIGZyb20gJy4vU2VjdGlvbi5zdmVsdGUnXG5pbXBvcnQgeyBpZkNsaWNrRXF1aXZhbGVudCB9IGZyb20gJy4vdXRpbCdcblxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG5leHBvcnQgbGV0IHN0YXRlID0gbmV3IFN0YXRlKClcbmV4cG9ydCBsZXQgdmVyc2lvbjogc3RyaW5nXG5leHBvcnQgbGV0IHNob3dUaXRsZSA9IGZhbHNlXG5cbiQ6IGRpc3BhdGNoKCdzdGF0ZVVwZGF0ZWQnLCB7IHN0YXRlIH0pXG5cbmZ1bmN0aW9uIGFkZFNlY3Rpb24oKSB7XG4gIHN0YXRlLnNlY3Rpb25zLnB1c2goeyBuYW1lOiBgU2VjdGlvbiAke3N0YXRlLnNlY3Rpb25zLmxlbmd0aCArIDF9YCwgY2hpbGRyZW46IFtdIH0pXG4gIHN0YXRlLnNlY3Rpb25zID0gc3RhdGUuc2VjdGlvbnNcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU2VjdGlvbihpOiBudW1iZXIpIHtcbiAgc3RhdGUuc2VjdGlvbnMuc3BsaWNlKGksIDEpXG4gIHN0YXRlLnNlY3Rpb25zID0gc3RhdGUuc2VjdGlvbnNcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzIHByb2dyZXNzLWNsb2Nrcy1wYW5lbFwiPlxuICB7I2lmIHNob3dUaXRsZX1cbiAgICA8aGVhZGVyIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXRpdGxlXCI+XG4gICAgICA8c3BhbiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy10aXRsZV9fbWFpbi10aXRsZVwiPlByb2dyZXNzIENsb2Nrczwvc3Bhbj5cbiAgICAgIDxhIGNsYXNzPVwicHJvZ3Jlc3MtY2xvY2tzLXRpdGxlX19zdWJ0aXRsZVwiIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vdG9rZW5zaGlmdC9vYnNpZGlhbi1wcm9ncmVzcy1jbG9ja3NcIj5cbiAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL3Rva2Vuc2hpZnQvb2JzaWRpYW4tcHJvZ3Jlc3MtY2xvY2tzXG4gICAgICA8L2E+XG4gICAgPC9oZWFkZXI+XG4gIHsvaWZ9XG5cbiAgeyNlYWNoIHN0YXRlLnNlY3Rpb25zIGFzIHNlY3Rpb24sIGl9XG4gICAgPFNlY3Rpb24gYmluZDpuYW1lPXtzZWN0aW9uLm5hbWV9IGJpbmQ6Y2hpbGRyZW49e3NlY3Rpb24uY2hpbGRyZW59IG9uOnJlbW92ZVNlY3Rpb249eygpID0+IHJlbW92ZVNlY3Rpb24oaSl9IC8+XG4gIHsvZWFjaH1cblxuICA8ZGl2XG4gICAgY2xhc3M9XCJwcm9ncmVzcy1jbG9ja3MtYnV0dG9uIHByb2dyZXNzLWNsb2Nrcy1wYW5lbF9fYWRkLXNlY3Rpb25cIlxuICAgIHJvbGU9XCJidXR0b25cIlxuICAgIHRhYmluZGV4PVwiMFwiXG4gICAgb246a2V5ZG93bj17aWZDbGlja0VxdWl2YWxlbnQoYWRkU2VjdGlvbil9XG4gICAgb246Y2xpY2s9e2FkZFNlY3Rpb259PlxuICAgIEFkZCBTZWN0aW9uXG4gIDwvZGl2PlxuXG4gIHsjaWYgc3RhdGUuZGVidWd9XG4gICAgPHByZSBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1kZWJ1Z1wiPlxuICB7SlNPTi5zdHJpbmdpZnkoc3RhdGUsIG51bGwsIDIpfVxuICA8L3ByZT5cbiAgey9pZn1cblxuICB7I2lmIHZlcnNpb259XG4gICAgPGRpdiBjbGFzcz1cInByb2dyZXNzLWNsb2Nrcy1wYW5lbF9fdmVyc2lvblwiPkNvdW50ZXJzIHZ7dmVyc2lvbn08L2Rpdj5cbiAgey9pZn1cbjwvZGl2PlxuIiwiaW1wb3J0IHR5cGUgUHJvZ3Jlc3NDbG9ja3NQbHVnaW4gZnJvbSAnLi9Qcm9ncmVzc0Nsb2Nrc1BsdWdpbidcbmltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBkZWJvdW5jZSB9IGZyb20gJ29ic2lkaWFuJ1xuaW1wb3J0IFBhbmVsIGZyb20gJy4vdWkvUGFuZWwuc3ZlbHRlJ1xuXG5leHBvcnQgY29uc3QgRElTUExBWV9URVhUID0gJ1Byb2dyZXNzIENsb2NrcydcbmV4cG9ydCBjb25zdCBJQ09OID0gJ3BpZS1jaGFydCcgLy8gSWNvbnMgZnJvbSBodHRwczovL2x1Y2lkZS5kZXYvaWNvbnMvXG5leHBvcnQgY29uc3QgVklFV19UWVBFID0gJ1BST0dSRVNTX0NMT0NLU19WSUVXJ1xuXG5jb25zdCBERUJPVU5DRV9TQVZFX1NUQVRFX1RJTUUgPSAxMDAwXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyZXNzQ2xvY2tzVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgbmF2aWdhdGlvbiA9IGZhbHNlXG5cbiAgY29uc3RydWN0b3IocHVibGljIHBsdWdpbjogUHJvZ3Jlc3NDbG9ja3NQbHVnaW4sIHB1YmxpYyBsZWFmOiBXb3Jrc3BhY2VMZWFmKSB7XG4gICAgc3VwZXIobGVhZilcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIERJU1BMQVlfVEVYVFxuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBJQ09OXG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIFZJRVdfVFlQRVxuICB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KClcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLnBsdWdpbi5sb2FkRGF0YSgpXG4gICAgY29uc3Qgc3RhdGUgPSBkYXRhPy5zdGF0ZSB8fCB7IHNlY3Rpb25zOiBbXSB9XG5cbiAgICBjb25zdCBwYW5lbCA9IG5ldyBQYW5lbCh7XG4gICAgICB0YXJnZXQ6IHRoaXMuY29udGVudEVsLFxuICAgICAgcHJvcHM6IHtcbiAgICAgICAgc2hvd1RpdGxlOiB0cnVlLFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgdmVyc2lvbjogdGhpcy5wbHVnaW4ubWFuaWZlc3QudmVyc2lvblxuICAgICAgfVxuICAgIH0pXG5cbiAgICBwYW5lbC4kb24oJ3N0YXRlVXBkYXRlZCcsIGRlYm91bmNlKCh7IGRldGFpbDogeyBzdGF0ZSB9IH0pID0+IHtcbiAgICAgIHRoaXMucGx1Z2luLnNhdmVEYXRhKHsgc3RhdGUgfSlcbiAgICB9LCBERUJPVU5DRV9TQVZFX1NUQVRFX1RJTUUsIHRydWUpKVxuXG4gIH1cbn0iLCJpbXBvcnQgeyBcbiAgRWRpdG9yVmlldyxcbiAgV2lkZ2V0VHlwZVxufSBmcm9tICdAY29kZW1pcnJvci92aWV3J1xuICBcbmltcG9ydCBDbG9jayBmcm9tICcuLi91aS9DbG9jay5zdmVsdGUnXG5cbnR5cGUgVXBkYXRlRXZlbnQgPSB7XG4gIGRldGFpbDoge1xuICAgIHNlZ21lbnRzOiBudW1iZXJcbiAgICBmaWxsZWQ6IG51bWJlclxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsb2NrV2lkZ2V0IGV4dGVuZHMgV2lkZ2V0VHlwZSB7XG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSBzZWdtZW50czogbnVtYmVyID0gNCxcbiAgICByZWFkb25seSBmaWxsZWQ6IG51bWJlciA9IDAsXG4gICAgcmVhZG9ubHkgbm9kZUZyb206IG51bWJlcixcbiAgICByZWFkb25seSBub2RlVG86IG51bWJlcikge1xuICAgIHN1cGVyKClcbiAgfVxuXG4gIHRvRE9NICh2aWV3OiBFZGl0b3JWaWV3KTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgY29udGFpbmVyLmFkZENsYXNzKCdwcm9ncmVzcy1jbG9ja3MtaW5saW5lJylcbiAgICBcbiAgICBjb25zdCBjbG9jayA9IG5ldyBDbG9jayh7XG4gICAgICB0YXJnZXQ6IGNvbnRhaW5lcixcbiAgICAgIHByb3BzOiB7XG4gICAgICAgIHNlZ21lbnRzOiB0aGlzLnNlZ21lbnRzLFxuICAgICAgICBmaWxsZWQ6IHRoaXMuZmlsbGVkXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNsb2NrLiRvbigndXBkYXRlZCcsIChldmVudDogVXBkYXRlRXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgc2VnbWVudHMsXG4gICAgICAgICAgZmlsbGVkXG4gICAgICAgIH1cbiAgICAgIH0gPSBldmVudFxuXG4gICAgICB2aWV3LmRpc3BhdGNoKHtcbiAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgIGZyb206IHRoaXMubm9kZUZyb20sXG4gICAgICAgICAgdG86IHRoaXMubm9kZVRvLFxuICAgICAgICAgIGluc2VydDogYGNsb2NrICR7ZmlsbGVkfSAvICR7c2VnbWVudHN9YFxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICByZXR1cm4gY29udGFpbmVyXG4gIH1cbn1cbiIsImltcG9ydCB7IFxuICBFZGl0b3JWaWV3LFxuICBXaWRnZXRUeXBlXG59IGZyb20gJ0Bjb2RlbWlycm9yL3ZpZXcnXG4gIFxuaW1wb3J0IENvdW50ZXIgZnJvbSAnLi4vdWkvQ291bnRlci5zdmVsdGUnXG5cbnR5cGUgVXBkYXRlRXZlbnQgPSB7XG4gIGRldGFpbDoge1xuICAgIHZhbHVlOiBudW1iZXJcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb3VudGVyV2lkZ2V0IGV4dGVuZHMgV2lkZ2V0VHlwZSB7XG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSB2YWx1ZTogbnVtYmVyID0gMCxcbiAgICByZWFkb25seSBub2RlRnJvbTogbnVtYmVyLFxuICAgIHJlYWRvbmx5IG5vZGVUbzogbnVtYmVyKSB7XG4gICAgc3VwZXIoKVxuICB9XG5cbiAgdG9ET00gKHZpZXc6IEVkaXRvclZpZXcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoJ3Byb2dyZXNzLWNsb2Nrcy1pbmxpbmUnKVxuICAgIFxuICAgIGNvbnN0IGNvdW50ZXIgPSBuZXcgQ291bnRlcih7XG4gICAgICB0YXJnZXQ6IGNvbnRhaW5lcixcbiAgICAgIHByb3BzOiB7XG4gICAgICAgIHZhbHVlOiB0aGlzLnZhbHVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvdW50ZXIuJG9uKCd1cGRhdGVkJywgKGV2ZW50OiBVcGRhdGVFdmVudCkgPT4ge1xuICAgICAgY29uc3Qge1xuICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICB2YWx1ZVxuICAgICAgICB9XG4gICAgICB9ID0gZXZlbnRcblxuICAgICAgdmlldy5kaXNwYXRjaCh7XG4gICAgICAgIGNoYW5nZXM6IHtcbiAgICAgICAgICBmcm9tOiB0aGlzLm5vZGVGcm9tLFxuICAgICAgICAgIHRvOiB0aGlzLm5vZGVUbyxcbiAgICAgICAgICBpbnNlcnQ6IGBjb3VudGVyICR7dmFsdWV9YFxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICByZXR1cm4gY29udGFpbmVyXG4gIH1cbn1cbiIsImltcG9ydCB7IFxuICBEZWNvcmF0aW9uLFxuICBFZGl0b3JWaWV3LFxuICBWaWV3UGx1Z2luLFxuICBWaWV3VXBkYXRlXG59IGZyb20gJ0Bjb2RlbWlycm9yL3ZpZXcnXG5cbmltcG9ydCB0eXBlIHtcbiAgRGVjb3JhdGlvblNldFxufSBmcm9tICdAY29kZW1pcnJvci92aWV3J1xuXG5pbXBvcnQge1xuICBzeW50YXhUcmVlXG59IGZyb20gJ0Bjb2RlbWlycm9yL2xhbmd1YWdlJ1xuXG5pbXBvcnQgdHlwZSB7XG4gIEVkaXRvclNlbGVjdGlvbixcbiAgUmFuZ2Vcbn0gZnJvbSAnQGNvZGVtaXJyb3Ivc3RhdGUnXG5cbmltcG9ydCB7IGVkaXRvckxpdmVQcmV2aWV3RmllbGQgfSBmcm9tICdvYnNpZGlhbidcblxuaW1wb3J0IHR5cGUgUHJvZ3Jlc3NDbG9ja3NQbHVnaW4gZnJvbSAnLi4vUHJvZ3Jlc3NDbG9ja3NQbHVnaW4nXG5cbmltcG9ydCBDbG9ja1dpZGdldCBmcm9tICcuL0Nsb2NrV2lkZ2V0J1xuaW1wb3J0IENvdW50ZXJXaWRnZXQgZnJvbSAnLi9Db3VudGVyV2lkZ2V0J1xuXG5jb25zdCBERUZBVUxUX0NMT0NLX1NFR01FTlRTID0gNFxuXG5jb25zdCBDTE9DS19QQVRURVJOID0gbmV3IFJlZ0V4cCgvY2xvY2soPzpcXHMrKFxcZCspXFxzKig/OlxcL1xccyooXFxkKykpPyk/L2kpXG5jb25zdCBDT1VOVEVSX1BBVFRFUk4gPSBuZXcgUmVnRXhwKC9jb3VudGVyKD86XFxzKyhcXGQrKSk/L2kpXG5cbmZ1bmN0aW9uIGlzU2VsZWN0aW9uV2l0aGluKHNlbGVjdGlvbjogRWRpdG9yU2VsZWN0aW9uLCByYW5nZUZyb206IG51bWJlciwgcmFuZ2VUbzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGZvciAoY29uc3QgcmFuZ2Ugb2Ygc2VsZWN0aW9uLnJhbmdlcykge1xuICAgIGlmIChyYW5nZS5mcm9tIDw9IHJhbmdlVG8gJiYgcmFuZ2UudG8gPj0gcmFuZ2VGcm9tKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufVxuXG5leHBvcnQgdHlwZSBDbG9ja0RldGFpbHMgPSB7XG4gIHNlZ21lbnRzOiBudW1iZXIsXG4gIGZpbGxlZDogbnVtYmVyXG59XG5cbmV4cG9ydCB0eXBlIENvdW50ZXJEZXRhaWxzID0ge1xuICB2YWx1ZTogbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGUgKGlucHV0OiBzdHJpbmcpIHtcbiAgaW5wdXQgPSBpbnB1dC50cmltKClcblxuICBsZXQgbWF0Y2ggPSBDTE9DS19QQVRURVJOLmV4ZWMoaW5wdXQpXG4gIGlmIChtYXRjaCkge1xuICAgIGNvbnN0IHNlZ21lbnRzID0gbWF0Y2hbMl0gPyBOdW1iZXIobWF0Y2hbMl0pIDogbWF0Y2hbMV0gPyBOdW1iZXIobWF0Y2hbMV0pIDogREVGQVVMVF9DTE9DS19TRUdNRU5UU1xuICAgIGNvbnN0IGZpbGxlZCA9IG1hdGNoWzJdID8gTnVtYmVyKG1hdGNoWzFdKSA6IDBcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnY2xvY2snLFxuICAgICAgc2VnbWVudHMsXG4gICAgICBmaWxsZWRcbiAgICB9XG4gIH1cblxuICBtYXRjaCA9IENPVU5URVJfUEFUVEVSTi5leGVjKGlucHV0KVxuICBpZiAobWF0Y2gpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG1hdGNoWzFdID8gTnVtYmVyKG1hdGNoWzFdKSA6IDBcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnY291bnRlcicsXG4gICAgICB2YWx1ZVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBjbGFzcyBJbmxpbmVQbHVnaW4ge1xuICBkZWNvcmF0aW9uczogRGVjb3JhdGlvblNldFxuXG4gIGNvbnN0cnVjdG9yICh2aWV3OiBFZGl0b3JWaWV3KSB7XG4gICAgdGhpcy5kZWNvcmF0aW9ucyA9IERlY29yYXRpb24ubm9uZVxuICB9XG5cbiAgdXBkYXRlICh1cGRhdGU6IFZpZXdVcGRhdGUpIHtcbiAgICBpZiAodXBkYXRlLmRvY0NoYW5nZWQgfHwgdXBkYXRlLnZpZXdwb3J0Q2hhbmdlZCB8fCB1cGRhdGUuc2VsZWN0aW9uU2V0KSB7XG4gICAgICBpZiAodXBkYXRlLnN0YXRlLmZpZWxkKGVkaXRvckxpdmVQcmV2aWV3RmllbGQpKSB7XG4gICAgICAgIHRoaXMuZGVjb3JhdGlvbnMgPSB0aGlzLmlubGluZVJlbmRlcih1cGRhdGUudmlldylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVjb3JhdGlvbnMgPSBEZWNvcmF0aW9uLm5vbmU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5saW5lUmVuZGVyICh2aWV3OiBFZGl0b3JWaWV3KSB7XG4gICAgY29uc3Qgd2lkZ2V0czogUmFuZ2U8RGVjb3JhdGlvbj5bXSA9IFtdXG4gIFxuICAgIGZvciAoY29uc3QgeyBmcm9tLCB0byB9IG9mIHZpZXcudmlzaWJsZVJhbmdlcykge1xuICAgICAgc3ludGF4VHJlZSh2aWV3LnN0YXRlKS5pdGVyYXRlKHtcbiAgICAgICAgZnJvbSxcbiAgICAgICAgdG8sXG4gICAgICAgIGVudGVyOiAoeyBub2RlIH0pID0+IHtcbiAgICAgICAgICBpZiAoL2Zvcm1hdHRpbmcvLnRlc3Qobm9kZS5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICBcbiAgICAgICAgICBpZiAoIS8uKj9fP2lubGluZS1jb2RlXz8uKi8udGVzdChub2RlLm5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gIFxuICBcbiAgICAgICAgICBpZiAoaXNTZWxlY3Rpb25XaXRoaW4odmlldy5zdGF0ZS5zZWxlY3Rpb24sIG5vZGUuZnJvbSwgbm9kZS50bykpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNyYyA9IHZpZXcuc3RhdGUuZG9jLnNsaWNlU3RyaW5nKG5vZGUuZnJvbSwgbm9kZS50bykudHJpbSgpXG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VDb2RlKHNyYylcblxuICAgICAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzd2l0Y2ggKHBhcnNlZC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdjbG9jayc6XG4gICAgICAgICAgICAgIGNvbnN0IHsgc2VnbWVudHMsIGZpbGxlZCB9ID0gcGFyc2VkXG5cbiAgICAgICAgICAgICAgd2lkZ2V0cy5wdXNoKERlY29yYXRpb24ucmVwbGFjZSh7XG4gICAgICAgICAgICAgICAgd2lkZ2V0OiBuZXcgQ2xvY2tXaWRnZXQoc2VnbWVudHMsIGZpbGxlZCwgbm9kZS5mcm9tLCBub2RlLnRvKVxuICAgICAgICAgICAgICB9KS5yYW5nZShub2RlLmZyb20sIG5vZGUudG8pKVxuXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgICAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gcGFyc2VkXG5cbiAgICAgICAgICAgICAgd2lkZ2V0cy5wdXNoKERlY29yYXRpb24ucmVwbGFjZSh7XG4gICAgICAgICAgICAgICAgd2lkZ2V0OiBuZXcgQ291bnRlcldpZGdldCh2YWx1ZSwgbm9kZS5mcm9tLCBub2RlLnRvKVxuICAgICAgICAgICAgICB9KS5yYW5nZShub2RlLmZyb20sIG5vZGUudG8pKVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICBcbiAgICByZXR1cm4gRGVjb3JhdGlvbi5zZXQod2lkZ2V0cylcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5saW5lUGx1Z2luIChwbHVnaW46IFByb2dyZXNzQ2xvY2tzUGx1Z2luKSB7XG4gIHJldHVybiBWaWV3UGx1Z2luLmZyb21DbGFzcyhJbmxpbmVQbHVnaW4sIHtcbiAgICBkZWNvcmF0aW9uczogKHZpZXcpID0+IHZpZXcuZGVjb3JhdGlvbnNcbiAgfSlcbn1cbiIsImltcG9ydCB0eXBlIHsgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCwgV29ya3NwYWNlTGVhZiB9IGZyb20gJ29ic2lkaWFuJ1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnb2JzaWRpYW4nXG5cbmltcG9ydCBQcm9ncmVzc0Nsb2Nrc1JlbmRlckNoaWxkIGZyb20gJy4vUHJvZ3Jlc3NDbG9ja3NSZW5kZXJDaGlsZCdcbmltcG9ydCBQcm9ncmVzc0Nsb2Nrc1ZpZXcsIHsgVklFV19UWVBFIH0gZnJvbSAnLi9Qcm9ncmVzc0Nsb2Nrc1ZpZXcnXG5pbXBvcnQgeyBpbmxpbmVQbHVnaW4sIHBhcnNlQ29kZSB9IGZyb20gJy4vaW5saW5lL0lubGluZVBsdWdpbidcbmltcG9ydCBDbG9jayBmcm9tICcuL3VpL0Nsb2NrLnN2ZWx0ZSdcbmltcG9ydCBDb3VudGVyIGZyb20gJy4vdWkvQ291bnRlci5zdmVsdGUnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyZXNzQ2xvY2tzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgYXN5bmMgb25sb2FkICgpIHtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFZJRVdfVFlQRSxcbiAgICAgIChsZWFmOiBXb3Jrc3BhY2VMZWFmKSA9PiBuZXcgUHJvZ3Jlc3NDbG9ja3NWaWV3KHRoaXMsIGxlYWYpKVxuXG4gICAgdGhpcy5hZGRWaWV3KClcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogJ29wZW4tcGFuZWwnLFxuICAgICAgbmFtZTogJ09wZW4gdGhlIHNpZGViYXIgdmlldycsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBsZWFmID0gYXdhaXQgdGhpcy5hZGRWaWV3KClcbiAgICAgICAgaWYgKGxlYWYpIHtcbiAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oaW5saW5lUGx1Z2luKHRoaXMpKVxuXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3Nvcih0aGlzLmhhbmRsZU1hcmtkb3duUG9zdFByb2Nlc3Nvci5iaW5kKHRoaXMpKVxuICB9XG5cbiAgYXN5bmMgYWRkVmlldyAoKSB7XG4gICAgaWYgKHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFKS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEUpWzBdXG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlPy5nZXRSaWdodExlYWYoZmFsc2UpPy5zZXRWaWV3U3RhdGUoe1xuICAgICAgICB0eXBlOiBWSUVXX1RZUEVcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRSlbMF1cbiAgfVxuXG4gIGFzeW5jIGhhbmRsZU1hcmtkb3duUG9zdFByb2Nlc3NvciAoZWw6IEhUTUxFbGVtZW50LCBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpIHtcbiAgICBjb25zdCBub2RlcyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2NvZGUnKVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSkge1xuICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldXG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUNvZGUobm9kZS5pbm5lclRleHQpXG5cbiAgICAgIGlmICghcGFyc2VkKSB7IGNvbnRpbnVlIH1cblxuICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGNvbnRhaW5lci5hZGRDbGFzcygncHJvZ3Jlc3MtY2xvY2tzLWlubGluZScpXG5cbiAgICAgIHN3aXRjaCAocGFyc2VkLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnY2xvY2snOlxuICAgICAgICAgIGNvbnN0IHsgc2VnbWVudHMsIGZpbGxlZCB9ID0gcGFyc2VkXG5cbiAgICAgICAgICBuZXcgQ2xvY2soe1xuICAgICAgICAgICAgdGFyZ2V0OiBjb250YWluZXIsXG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICBzZWdtZW50cyxcbiAgICAgICAgICAgICAgZmlsbGVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIG5vZGUucmVwbGFjZVdpdGgoY29udGFpbmVyKVxuXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnY291bnRlcic6XG4gICAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gcGFyc2VkXG5cbiAgICAgICAgICBuZXcgQ291bnRlcih7XG4gICAgICAgICAgICB0YXJnZXQ6IGNvbnRhaW5lcixcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIG5vZGUucmVwbGFjZVdpdGgoY29udGFpbmVyKVxuXG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJub3ciLCJlbGVtZW50IiwidGV4dCIsImhhc2giLCJkZXRhY2giLCJpbml0IiwidGljayIsInVwZGF0ZSIsImluc3RhbmNlIiwiY3JlYXRlX2ZyYWdtZW50IiwiY3R4IiwiZGVmYXVsdEF0dHJpYnV0ZXMiLCJfYSIsImxpbmVhciIsImNyZWF0ZV9pZl9ibG9ja18xIiwiRWRpdE1vZGUiLCJjcmVhdGVfaWZfYmxvY2siLCJ0YWtlRm9jdXMiLCJkaXNwYXRjaCIsInNlZ21lbnRzIiwiZmlsbGVkIiwic2hvd01pbGxpcyIsImNoaWxkcmVuIiwiSXRlbVZpZXciLCJkZWJvdW5jZSIsInN0YXRlIiwiV2lkZ2V0VHlwZSIsInZpZXciLCJEZWNvcmF0aW9uIiwiZWRpdG9yTGl2ZVByZXZpZXdGaWVsZCIsInN5bnRheFRyZWUiLCJWaWV3UGx1Z2luIiwiUGx1Z2luIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxPQUFPO0FBQUc7QUFDbkIsTUFBTSxXQUFXLE9BQUs7QUFDdEIsU0FBUyxPQUFPLEtBQUssS0FBSztBQUV0QixhQUFXLEtBQUs7QUFDWixRQUFJLEtBQUssSUFBSTtBQUNqQixTQUFPO0FBQ1g7QUFXQSxTQUFTLElBQUksSUFBSTtBQUNiLFNBQU8sR0FBRTtBQUNiO0FBQ0EsU0FBUyxlQUFlO0FBQ3BCLFNBQU8sdUJBQU8sT0FBTyxJQUFJO0FBQzdCO0FBQ0EsU0FBUyxRQUFRLEtBQUs7QUFDbEIsTUFBSSxRQUFRLEdBQUc7QUFDbkI7QUFDQSxTQUFTLFlBQVksT0FBTztBQUN4QixTQUFPLE9BQU8sVUFBVTtBQUM1QjtBQUNB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
