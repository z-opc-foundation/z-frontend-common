// Generated from /Users/zifang/workplace/ceo_workplace/z-opc-foundation/z-util/z-util-dsl/z-util-parser/z-util-parser-json/src/main/resources/JsonParser.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from 'antlr4';
import JsonParserVisitor from './JsonParserVisitor.js';

const serializedATN = [4,1,13,63,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,
2,5,7,5,2,6,7,6,2,7,7,7,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,3,1,25,8,1,1,2,1,
2,1,2,1,2,5,2,31,8,2,10,2,12,2,34,9,2,3,2,36,8,2,1,2,1,2,1,3,1,3,1,3,1,3,
1,4,1,4,1,4,1,4,5,4,48,8,4,10,4,12,4,51,9,4,3,4,53,8,4,1,4,1,4,1,5,1,5,1,
6,1,6,1,7,1,7,1,7,0,0,8,0,2,4,6,8,10,12,14,0,0,63,0,16,1,0,0,0,2,24,1,0,
0,0,4,26,1,0,0,0,6,39,1,0,0,0,8,43,1,0,0,0,10,56,1,0,0,0,12,58,1,0,0,0,14,
60,1,0,0,0,16,17,3,2,1,0,17,1,1,0,0,0,18,25,3,4,2,0,19,25,3,8,4,0,20,25,
3,10,5,0,21,25,3,12,6,0,22,25,3,14,7,0,23,25,5,9,0,0,24,18,1,0,0,0,24,19,
1,0,0,0,24,20,1,0,0,0,24,21,1,0,0,0,24,22,1,0,0,0,24,23,1,0,0,0,25,3,1,0,
0,0,26,35,5,3,0,0,27,32,3,6,3,0,28,29,5,7,0,0,29,31,3,6,3,0,30,28,1,0,0,
0,31,34,1,0,0,0,32,30,1,0,0,0,32,33,1,0,0,0,33,36,1,0,0,0,34,32,1,0,0,0,
35,27,1,0,0,0,35,36,1,0,0,0,36,37,1,0,0,0,37,38,5,4,0,0,38,5,1,0,0,0,39,
40,3,10,5,0,40,41,5,8,0,0,41,42,3,2,1,0,42,7,1,0,0,0,43,52,5,5,0,0,44,49,
3,2,1,0,45,46,5,7,0,0,46,48,3,2,1,0,47,45,1,0,0,0,48,51,1,0,0,0,49,47,1,
0,0,0,49,50,1,0,0,0,50,53,1,0,0,0,51,49,1,0,0,0,52,44,1,0,0,0,52,53,1,0,
0,0,53,54,1,0,0,0,54,55,5,6,0,0,55,9,1,0,0,0,56,57,5,12,0,0,57,11,1,0,0,
0,58,59,5,11,0,0,59,13,1,0,0,0,60,61,5,10,0,0,61,15,1,0,0,0,5,24,32,35,49,
52];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class JsonParser extends antlr4.Parser {

    static grammarFileName = "JsonParser.g4";
    static literalNames = [ null, null, null, "'{'", "'}'", "'['", "']'", 
                            "','", "':'", "'null'" ];
    static symbolicNames = [ null, "Space", "EOL", "LBrace", "RBrace", "LBracket", 
                             "RBracket", "Comma", "Colon", "Null", "Bool", 
                             "Number", "StringLiteral", "AnyChar" ];
    static ruleNames = [ "json", "value", "object", "pair", "array", "string", 
                         "number", "bool" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = JsonParser.ruleNames;
        this.literalNames = JsonParser.literalNames;
        this.symbolicNames = JsonParser.symbolicNames;
    }



	json() {
	    let localctx = new JsonContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, JsonParser.RULE_json);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 16;
	        this.value();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	value() {
	    let localctx = new ValueContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, JsonParser.RULE_value);
	    try {
	        this.state = 24;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 3:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 18;
	            this.object();
	            break;
	        case 5:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 19;
	            this.array();
	            break;
	        case 12:
	            this.enterOuterAlt(localctx, 3);
	            this.state = 20;
	            this.string();
	            break;
	        case 11:
	            this.enterOuterAlt(localctx, 4);
	            this.state = 21;
	            this.number();
	            break;
	        case 10:
	            this.enterOuterAlt(localctx, 5);
	            this.state = 22;
	            this.bool();
	            break;
	        case 9:
	            this.enterOuterAlt(localctx, 6);
	            this.state = 23;
	            this.match(JsonParser.Null);
	            break;
	        default:
	            throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	object() {
	    let localctx = new ObjectContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 4, JsonParser.RULE_object);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 26;
	        this.match(JsonParser.LBrace);
	        this.state = 35;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===12) {
	            this.state = 27;
	            this.pair();
	            this.state = 32;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while(_la===7) {
	                this.state = 28;
	                this.match(JsonParser.Comma);
	                this.state = 29;
	                this.pair();
	                this.state = 34;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 37;
	        this.match(JsonParser.RBrace);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	pair() {
	    let localctx = new PairContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 6, JsonParser.RULE_pair);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 39;
	        this.string();
	        this.state = 40;
	        this.match(JsonParser.Colon);
	        this.state = 41;
	        this.value();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	array() {
	    let localctx = new ArrayContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 8, JsonParser.RULE_array);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 43;
	        this.match(JsonParser.LBracket);
	        this.state = 52;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if((((_la) & ~0x1f) === 0 && ((1 << _la) & 7720) !== 0)) {
	            this.state = 44;
	            this.value();
	            this.state = 49;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while(_la===7) {
	                this.state = 45;
	                this.match(JsonParser.Comma);
	                this.state = 46;
	                this.value();
	                this.state = 51;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 54;
	        this.match(JsonParser.RBracket);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	string() {
	    let localctx = new StringContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 10, JsonParser.RULE_string);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 56;
	        this.match(JsonParser.StringLiteral);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	number() {
	    let localctx = new NumberContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 12, JsonParser.RULE_number);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 58;
	        this.match(JsonParser.Number);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	bool() {
	    let localctx = new BoolContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 14, JsonParser.RULE_bool);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 60;
	        this.match(JsonParser.Bool);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

JsonParser.EOF = antlr4.Token.EOF;
JsonParser.Space = 1;
JsonParser.EOL = 2;
JsonParser.LBrace = 3;
JsonParser.RBrace = 4;
JsonParser.LBracket = 5;
JsonParser.RBracket = 6;
JsonParser.Comma = 7;
JsonParser.Colon = 8;
JsonParser.Null = 9;
JsonParser.Bool = 10;
JsonParser.Number = 11;
JsonParser.StringLiteral = 12;
JsonParser.AnyChar = 13;

JsonParser.RULE_json = 0;
JsonParser.RULE_value = 1;
JsonParser.RULE_object = 2;
JsonParser.RULE_pair = 3;
JsonParser.RULE_array = 4;
JsonParser.RULE_string = 5;
JsonParser.RULE_number = 6;
JsonParser.RULE_bool = 7;

class JsonContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_json;
    }

	value() {
	    return this.getTypedRuleContext(ValueContext,0);
	};

	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitJson(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class ValueContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_value;
    }

	object() {
	    return this.getTypedRuleContext(ObjectContext,0);
	};

	array() {
	    return this.getTypedRuleContext(ArrayContext,0);
	};

	string() {
	    return this.getTypedRuleContext(StringContext,0);
	};

	number() {
	    return this.getTypedRuleContext(NumberContext,0);
	};

	bool() {
	    return this.getTypedRuleContext(BoolContext,0);
	};

	Null() {
	    return this.getToken(JsonParser.Null, 0);
	};

	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitValue(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class ObjectContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_object;
    }

	LBrace() {
	    return this.getToken(JsonParser.LBrace, 0);
	};

	RBrace() {
	    return this.getToken(JsonParser.RBrace, 0);
	};

	pair = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(PairContext);
	    } else {
	        return this.getTypedRuleContext(PairContext,i);
	    }
	};

	Comma = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(JsonParser.Comma);
	    } else {
	        return this.getToken(JsonParser.Comma, i);
	    }
	};


	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitObject(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class PairContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_pair;
    }

	string() {
	    return this.getTypedRuleContext(StringContext,0);
	};

	Colon() {
	    return this.getToken(JsonParser.Colon, 0);
	};

	value() {
	    return this.getTypedRuleContext(ValueContext,0);
	};

	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitPair(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class ArrayContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_array;
    }

	LBracket() {
	    return this.getToken(JsonParser.LBracket, 0);
	};

	RBracket() {
	    return this.getToken(JsonParser.RBracket, 0);
	};

	value = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(ValueContext);
	    } else {
	        return this.getTypedRuleContext(ValueContext,i);
	    }
	};

	Comma = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(JsonParser.Comma);
	    } else {
	        return this.getToken(JsonParser.Comma, i);
	    }
	};


	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitArray(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class StringContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_string;
    }

	StringLiteral() {
	    return this.getToken(JsonParser.StringLiteral, 0);
	};

	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitString(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class NumberContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_number;
    }

	Number() {
	    return this.getToken(JsonParser.Number, 0);
	};

	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitNumber(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class BoolContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JsonParser.RULE_bool;
    }

	Bool() {
	    return this.getToken(JsonParser.Bool, 0);
	};

	accept(visitor) {
	    if ( visitor instanceof JsonParserVisitor ) {
	        return visitor.visitBool(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}




JsonParser.JsonContext = JsonContext; 
JsonParser.ValueContext = ValueContext; 
JsonParser.ObjectContext = ObjectContext; 
JsonParser.PairContext = PairContext; 
JsonParser.ArrayContext = ArrayContext; 
JsonParser.StringContext = StringContext; 
JsonParser.NumberContext = NumberContext; 
JsonParser.BoolContext = BoolContext; 
