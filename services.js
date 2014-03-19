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

.value('default_definition',
'participant: Alice as A\n\
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
A->User: Done')

.value('post_script_functions',
'/SEED 120 def\n\
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
)
