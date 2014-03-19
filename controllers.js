angular.module('myApp').controller('AppController', ['$scope', '$window', 'rnd', function(scope, $window, rnd){
  scope.margin = 10
  scope.user_width = 100
  scope.user_height = 50
  scope.note_width = 100
  scope.note_height = 30
  scope.height = 0
  scope.width = 0
  scope.lines = []
  scope.users = []
  scope.arrows = []
  scope.notes = []
  scope.wantHandDraw = false
  scope.paperSizes = {
    A0: {width: 2384, height: 3370},
    A1: {width: 1684, height: 2384},
    A2: {width: 1191, height: 1684},
    A3:{width:  842, height: 1191},
    A4:{width:  595, height: 842},
  }
  scope.pageSizes = Object.keys(scope.paperSizes)
  scope.pageSize = 'A4'
  scope.definition = 'participant: Alice as A\n\
participant: B\n\
\n\
User->A: DoWork\n\
A-->B: <<createRequest>>\n\
note right of B: what should I do?\n\
B-->C: DoWork\n\
note over C: processing...\n\
C->B: WorkDone\n\
note left of B: hmm.. it was fast\n\
B->A: RequestCreated\n\
A->User: Done'
  scope.$watch('definition', function(){
    scope.draw()
  })
  scope.log = function(data){
    console && console.log && console.log(data)
    return data
  }
  scope.Math = Math
  scope.download = function(text) {
    $window.location.href =
      'data:application/x-download;charset=utf-8,' +
      encodeURIComponent(text)
  }
  scope.draw = function(){
    scope.height = scope.user_height + scope.margin
    scope.width = -100
    scope.users = []
    scope.lines = []
    scope.arrows = []
    scope.notes = []
    var lines = scope.definition.split('\n')
    for (var i in lines) {
      var line = lines[i].trim()
      if (/^([^-]*(-+[^-]+)*)(-->|->)(.*):(.*)$/.exec(line) != null) {
        var from = RegExp.$1.trim()
        var arrow = RegExp.$3.trim()
        var to = RegExp.$4.trim()
        var text = RegExp.$5.trim()
        // console.log(line+' => from: '+from+', to: '+to+', text: '+text)
        var ufrom = scope.getUser(from)
        var uto = scope.getUser(to)
        scope.arrows.push({
          x: ufrom.x + scope.user_width / 2,
          y: scope.height + scope.user_height / 2,
          length: Math.abs(ufrom.x - uto.x),
          direction: uto.x > ufrom.x ? 1 : -1,
          text: text,
          dashed: (arrow == '-->')
        })
        scope.height += 50
      } else if (/^participant:(.*) as (.*)$/.exec(line) != null) {
        var who = RegExp.$1.trim()
        var alias = RegExp.$2.trim()
        scope.getUser(who, alias)
      } else if (/^participant:(.*)$/.exec(line) != null) {
        var who = RegExp.$1.trim()
        scope.getUser(who)
      } else if (/^note (left of|right of|over) (.*):(.*)$/.exec(line) != null) {
        var position = RegExp.$1.trim()
        var who = RegExp.$2.trim()
        var text = RegExp.$3.trim()
        var user = scope.getUser(who)
        var dx
        if (position == 'right of') dx = scope.margin
        else if (position == 'left of') dx = -scope.margin - scope.note_width
        else if (position == 'over') dx = -scope.note_width / 2
        scope.notes.push({
          x: user.x + scope.user_width / 2 + dx,
          y: scope.height,
          text: text
        })
        scope.height += scope.note_height
      }
    }
    //add height for margin and height for bottom user boxes
    scope.height += scope.margin + scope.user_height
    //add vertical lines
    for (var i in scope.users) {
      var user = scope.users[i]
      scope.lines.push({
        x: user.x + scope.user_width / 2, y: scope.user_height,
        dx: 0, dy: scope.height - 2 * scope.user_height
      })
    }
    //add bottom user boxes
    for (var i in scope.users) {
      var user = scope.users[i]
      scope.users.push({
        x: user.x,
        y: scope.height - scope.user_height,
        name: user.name
      })
    }
    // console.log(scope.users, scope.lines, scope.arrows)
  }
  scope.getUser = function(name, alias){
    for (var i = 0; i < scope.users.length; i++) {
      var user = scope.users[i]
      if (user.name == name || user.alias == name) {
        return user
      }
    }
    scope.width += 200
    var user = {
      x: scope.width - scope.user_width,
      y: 0,
      name: name,
      alias: alias
    }
    scope.users.push(user)
    return user
  }
  scope.byHand = function(x1, y1, x2, y2) {
    var points = x1+','+y1
    if (scope.wantHandDraw) {
      rnd.reset()
      //number of segments (one segment for every 10 pixels)
      var seg = Math.ceil(Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2))/10)
      var inaccuracy = 2
      function mod(x){
        return x + rnd.next() * inaccuracy - inaccuracy / 2
      }
      var x = x1
      var y = y1
      var dx = (x2 - x1) / seg
      var dy = (y2 - y1) / seg
      for (var i = 1; i < seg; i++) {
        x += dx
        y += dy
        points += ' '+mod(x)+','+mod(y)
      }
    }
    return points+' '+x2+','+y2
  }
  scope.rectByHand = function(x1, y1, x2, y2) {
    return [
      scope.byHand(x1,y1, x2,y1),
      scope.byHand(x2,y1, x2,y2),
      scope.byHand(x2,y2, x1, y2),
      scope.byHand(x1,y2, x1, y1)
      ].join(" ")
  }
  scope.print = function(){
    // PostScript reference: http://www.ugrad.math.ubc.ca/Flat/
    var page = scope.paperSizes[scope.pageSize]
    var sw = (page.width - 2 * scope.margin) / scope.width
    var sh = (page.height - 2 * scope.margin) / scope.height
    var rotate = false
    var scale = Math.min(sw, sh)
    if (sw < sh) {
      rotate = true
      sw = (page.height - 2 * scope.margin) / scope.width
      sh = (page.width - 2 * scope.margin) / scope.height
      scale = Math.min(sw, sh)
    }
    var ps = '%!PS\n\
/PageSize '+scope.pageSize+'\n\
'+(rotate ? page.width+' 0 translate 90 rotate' : '')+'\n\
'+scope.margin+' '+scope.margin+' translate\n\
'+scale+' '+scale+' scale\n\
/UW '+scope.user_width+' def %user_width\n\
/UH '+scope.user_height+' def %user_height\n\
/NW '+scope.note_width+' def %note_width\n\
/NH '+scope.note_height+' def %note_height\n\
/wantHandDraw '+(scope.wantHandDraw ? 1 : 0)+' def\n\
/SEED 120 def\n\
/MOD {\n\
  % a mod b == a - floor(a / b) * b\n\
  2 copy div floor mul neg add\n\
} def\n\
/RND { % returns a float number between -x and x\n\
  /SEED SEED 13 mul 1 add 256 mod def\n\
  neg dup neg\n\
  %-x x\n\
  SEED 256 div\n\
  %-x x rnd\n\
  mul 2 mul add\n\
} def\n\
/L {%dx dy x0 y0\n\
  /SEED 120 def\n\
  moveto LL\n\
} def\n\
/LL {\n\
  %dx dy\n\
  matrix currentmatrix %saves current transformation matrix\n\
  3 1 roll\n\
  %CTM dx dy\n\
  currentpoint translate\n\
  %compute how many segments we want to use\n\
  2 copy abs exch abs add 10 div ceiling cvi\n\
  %CTM dx dy count\n\
  3 1 roll\n\
  %CTM count dx dy\n\
  1 index 3 index div  1 index 4 index div\n\
  %CTM count dx dy stepx stepy\n\
  0 0\n\
  %CTM count dx dy stepx stepy x y\n\
  7 -1 roll\n\
  %CTM dx dy stepx stepy x y count\n\
  -1 add {\n\
    2 index add  exch %y += stepy\n\
    3 index add  exch %x += stepx\n\
    2 copy 1 RND add exch 1 RND add exch lineto\n\
  } repeat\n\
  %add the last segment without any randomization\n\
  2 index add  exch\n\
  3 index add  exch\n\
  lineto\n\
  pop pop pop pop\n\
  setmatrix %restore CTM\n\
} def\n\
0 wantHandDraw eq {\n\
  /LL {rlineto} def\n\
} if\n\
/ARROW { % text x y direction length\n\
  /Times-Roman findfont 15 scalefont setfont\n\
  2 setlinewidth 1 setlinejoin 1 setlinecap\n\
  newpath\n\
  % text x y direction length\n\
  2 copy mul 0\n\
  % text x y direction length dx 0\n\
  5 index 5 index L\n\
  % text x y direction length\n\
  currentpoint stroke moveto\n\
  [] 0 setdash\n\
  %draw the arrow head\n\
  1 index\n\
  dup -10 mul -10 rmoveto\n\
  dup 10 mul 10 LL\n\
  -10 mul 10 LL\n\
  stroke\n\
  % text x y direction length\n\
  % fill the background of the text with white\n\
  3 index 3 index moveto %move to x,y\n\
  % text x y direction length\n\
  2 copy\n\
  % text x y direction length direction length\n\
  mul 2 div 2 rmoveto %move to the center of the arrow\n\
  % text x y direction length\n\
  4 index stringwidth pop 2 div neg 0 rmoveto %move to the left side of the text\n\
  4 index stringwidth pop 0 rlineto\n\
  0 17 rlineto\n\
  4 index stringwidth pop neg 0 rlineto\n\
  closepath\n\
  1 setgray\n\
  fill\n\
  stroke\n\
  % text x y direction length\n\
  % draw the text\n\
  0 setgray\n\
  3 index 3 index moveto\n\
  mul 2 div 6 rmoveto\n\
  pop pop\n\
  dup stringwidth pop 2 div neg 0 rmoveto\n\
  show\n\
  stroke\n\
} def\n\
/DASHEDARROW { % text x y direction length\n\
  [9 4] 0 setdash\n\
  ARROW\n\
} def\n\
/RECT {\n\
  %x y width height\n\
  1 index 0  5 index 5 index  L %line: width 0 x y\n\
  0 1 index  LL %rlineto: 0 height\n\
  1 index neg 0  LL %rlineto: -width 0\n\
  0 1 index neg  LL %rlineto: 0 -height\n\
  pop pop pop pop\n\
} def\n\
/FILLRECT {\n\
  %fillgray bordergray x y width height\n\
  % draw the gray background\n\
  newpath 4 copy RECT closepath\n\
  5 index setgray\n\
  fill\n\
  % draw the border of the box\n\
  %fillgray bordergray x y width height\n\
  newpath RECT closepath\n\
  setgray stroke pop\n\
} def\n\
/USER { %name x y\n\
  /Times-Roman findfont 15 scalefont setfont\n\
  2 setlinewidth\n\
  0.84375 0  3 index 3 index  UW UH neg FILLRECT\n\
  % draw the text in the center of the box\n\
  newpath\n\
  moveto\n\
  UW 2 div UH neg 2 div rmoveto % center of the box\n\
  0 -5 rmoveto % lower the text a little bit, so it will be in the center of the box visually\n\
  0 setgray\n\
  dup stringwidth pop 2 div neg 0 rmoveto\n\
  show\n\
  stroke\n\
} def\n\
/LINE { %x y dx dy\n\
  2 setlinewidth\n\
  1 setlinejoin\n\
  1 setlinecap\n\
  newpath\n\
  4 2 roll L\n\
  stroke\n\
} def\n\
/NOTE { %text x y\n\
  /Times-Roman findfont 10 scalefont setfont\n\
  1 setlinewidth\n\
  % draw the filled rect\n\
  1 0  3 index 3 index  NW NH neg FILLRECT\n\
  % draw the text in the center of the box\n\
  newpath\n\
  moveto\n\
  NW 2 div NH neg 2 div rmoveto % center of the box\n\
  0 -3 rmoveto % lower the text a little bit, so it will be in the center of the box visually\n\
  0 setgray\n\
  dup stringwidth pop 2 div neg 0 rmoveto\n\
  show\n\
  stroke\n\
} def\n\
'
    for (var i in scope.users) {
      var user = scope.users[i]
      ps += '('+user.name+') '+user.x+' '+(scope.height-user.y)+' USER\n'
    }
    for (var i in scope.lines) {
      var line = scope.lines[i]
      ps += line.x+' '+(scope.height-line.y)+' '+line.dx+' '+(-line.dy)+' LINE\n'
    }
    for (var i in scope.arrows) {
      var arrow = scope.arrows[i]
      ps += '('+arrow.text+') '+arrow.x+' '+(scope.height-arrow.y)+' '+
        arrow.direction+' '+arrow.length+' '+(arrow.dashed ? 'DASHED' : '')+'ARROW\n'
    }
    for (var i in scope.notes) {
      var note = scope.notes[i]
      ps += '('+note.text+') '+note.x+' '+(scope.height-note.y)+' NOTE\n'
    }
    ps += 'showpage\n'
    // console.log(ps)
    scope.download(ps)
  }
}])
