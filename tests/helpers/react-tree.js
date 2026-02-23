const React = require("react");

function walkTree(node, visitor) {
  if (Array.isArray(node)) {
    node.forEach((item) => walkTree(item, visitor));
    return;
  }

  if (!React.isValidElement(node)) {
    return;
  }

  visitor(node);

  React.Children.toArray(node.props?.children).forEach((child) => {
    walkTree(child, visitor);
  });
}

function findAllElements(tree, predicate) {
  const matches = [];
  walkTree(tree, (element) => {
    if (predicate(element)) {
      matches.push(element);
    }
  });
  return matches;
}

function findFirstElement(tree, predicate) {
  return findAllElements(tree, predicate)[0] || null;
}

function textFromChildren(children) {
  const parts = [];

  function append(child) {
    if (Array.isArray(child)) {
      child.forEach(append);
      return;
    }

    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
      return;
    }

    if (React.isValidElement(child)) {
      append(child.props?.children);
    }
  }

  append(children);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function treeText(tree) {
  return textFromChildren(tree?.props?.children || tree);
}

module.exports = {
  findAllElements,
  findFirstElement,
  textFromChildren,
  treeText,
  walkTree,
};
