angular.module('myApp').service('rnd', function(){
  var seed = 123
  return {
    reset: function(){
      seed = 123
    },
    next: function(){
      seed = ((seed * 134775813) + 1) % 4294967296
      return seed / 4294967296
    }
  }
})
