/**
 * Created by andrey on 26.02.16.
 */
var module = angular.module("TeRepeat", []);
var isFunction = function (object) {
    return typeof object === 'function';
};

var isString = function (object) {
    return typeof object === 'string';
};

var hideNode = function (node) {
    node.css("display", "none");
};

var showNode = function (node) {
    node.css("display", "block");
};

var teRepeatDirective = function ($parse, $timeout, $animate) {
    return {
        transclude: "element",
        priority: 1000,
        scope: true,
        terminal: true,
        compile: function ($$element, $$attrs, $linker) {
            return function ($scope, $element, $attrs) {
                var previousNode;
                var LIMIT = $attrs.limit || 100;
                var listParser = $parse($attrs.teRepeat);
                var customLoader = $parse($attrs.loader)($scope.$parent);
                var LOADER = customLoader || require("./stack.loader");
                var nodeMap = {};
                var actuals = [];
                var customTrackBy = $parse($attrs.trackBy)($scope.$parent);
                var itemName = $attrs.item || "item";
                var trackBy = isFunction(customTrackBy) ? customTrackBy :
                    isString($attrs.trackBy) ?
                        function (item) {
                            return item[$attrs.trackBy];
                        } :
                        function (item, index, list) {
                            return JSON.stringify(item);
                        }

                var renderEl = function (item, index, list) {
                    var id;
                    var tracker = trackBy(item, index, list);
                    var node = nodeMap[tracker];
                    if (!node) {
                        //id = LOADER.registerLoader(function () {
                        var childScope = $scope.$new();
                        childScope[itemName] = item;
                        childScope.$index = index;
                        $linker(childScope, function (clone) {
                            nodeMap[tracker] = {element: clone, visible: true, scope: childScope};
                            $animate.enter(clone, null, angular.element(previousNode));
                            previousNode = clone;
                        });
                        // $timeout(function () {
                        //    LOADER.unregisterLoader(id);
                        //  });
                        //});

                    } else {
                        if (!node.visible) {
                            showNode(node.element);
                            nodeMap[tracker].visible = true;
                            nodeMap[tracker].scope[itemName] = item;
                        }
                        if (node.scope.$index !== index && node.element[0].previousSibling !== previousNode[0]) {
                            // id = LOADER.registerLoader(function () {
                            //$animate.move(node.element, null, angular.element(previousNode));
                            //  });
                        }
                        actuals.splice(node.scope.$index, 1);
                        nodeMap[tracker].scope.$index = index;
                        previousNode = node.element;
                    }
                };

                LOADER.setLimit(LIMIT);
                LOADER.setTimeout(20);
                var render = function (list) {
                    LOADER.clearQueue();
                    previousNode = $element[0];
                    list.forEach(function (item, index) {
                        if (index === 1) {
                            LOADER.setTimeout(150);
                        }
                        var id = LOADER.registerLoader(
                            function () {
                                renderEl(item, index, list);

                                $timeout(function () {
                                    LOADER.unregisterLoader(id);
                                });
                            });
                    });
                    var id = LOADER.registerLoader(
                        function () {
                            for (var i = 0; i < actuals.length; i++) {
                                var node = nodeMap[actuals[i]];
                                if (!!node && node.visible) {
                                    hideNode(node.element);
                                    nodeMap[actuals[i]].visible = false;
                                }
                            }

                            $timeout(function () {
                                actuals = Object.keys(nodeMap);
                                LOADER.unregisterLoader(id);
                                LOADER.clearQueue();
                            });
                        });

                };

                $scope.$watchCollection(function () {
                    return listParser($scope.$parent);
                }, render);

                $scope.$on("$destroy", function () {
                    nodeMap = undefined;
                    LOADER.clearQueue();
                });
            };
        }
    };
};

module.directive("teRepeat", ['$parse', '$timeout', '$animate', teRepeatDirective]);