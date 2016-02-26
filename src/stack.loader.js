/**
 * Created by andrey on 26.02.16.
 */

var StackLoader = (function (loader) {
    var limit = 15;    //лимит порции выполнения
    var callers = [];  //массив задач
    var timeout = 180;
    var counter = 0;   //счетчик задач
    var garbageCollector = {};

    var currentRunLoaders = 0;
    //синхронизация состояния
    var synchronize = function () {
        var maxLength = limit > callers.length ? callers.length : limit;
        if (currentRunLoaders > limit) {
            return false;
        }
        setTimeout(function () {
            for (var i = 0; i < maxLength; i++) {
                if (!callers[i]) {
                    return;
                }
                if (!callers[i].state) {
                    callers[i].state = true;
                    callers[i].handler();
                    currentRunLoaders++;
                }
            }
        }, timeout);

    };
    //зарегистрировать задачу
    loader.registerLoader = function (callFunc) {
        counter++;
        var id = counter;
        callers.push({state: false, handler: callFunc, id: id});
        synchronize();
        //var timeoutId = setTimeout(synchronize, timeout);
        //garbageCollector[id] = timeoutId;
        return id;
    };
    //убрать задачу из очереди выполнения
    loader.unregisterLoader = function (index) {
        var findId;
        for (var i=0; i<callers.length;i++) {
            if (callers[i].id === index) {
                callers.splice(i, 1);
                currentRunLoaders--;
                break;
            }
        }
        delete garbageCollector[index];
        setTimeout(synchronize, 200);
    };
    //очистить очередь
    loader.clearQueue = function () {
        Object.keys(garbageCollector).forEach(function (callerId) {
            clearTimeout(garbageCollector[callerId]);
        });
        callers = [];
        currentRunLoaders = 0;
        counter = 0;
        garbageCollector = {};
    };
    //установить лимит порции
    loader.setLimit = function (limitTo) {
        limit = parseInt(limitTo);
    };

    loader.setTimeout = function (timeoutTo) {
        timeout = timeoutTo;
    };

    return loader;
})({});

module.exports = StackLoader;