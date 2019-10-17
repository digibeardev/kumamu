// mushcode Grammar
// Author: Lemuel Canady, Jr (digibeario@gmail.com)
// This grammar is really basic, but it gets the job done!
// Builds an AST to be processed by the game server.

expression =  f:function  {return f} / 
			        "["_ f: function _ "]" {return f}
 
function =  _ call: word "(" _ a: (args)? _ ")" _  
{ 
	return {
    type: "function", 
    operator: {type: "word", value:call}, 
    args: Array.isArray(a) ? a : [a]
  }
}
args  =  a:(arg arg)+ _ t:args* 
{return [{type: "list", value: a.flat()},...t].flat()}/ 
        
        a: arg* _ "," b:(blank)* "," _ t: (args)* 
{ return 	[[a,{type: "word", value: null}].flat(),t.flat()].flat() }/
        
        a: arg* _ "," _ t: (args)* {return [a.flat(),t.flat()].flat()}/ 
		    arg 
        
arg   =  e: expression {return e}/ w: word { return {type: "word", value: w} }

blank =  b: [ ] 
word  =  w: [^\(\),\[\]]+ {return w.join("").trim()} 
_     =  [ \t\n\r]*

