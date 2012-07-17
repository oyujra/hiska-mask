/*
	Hiska Input plugin for jQuery
	Copyright (c) 2012-@Year Omar Yujra (hiskasoft.com)
	Licensed under the MIT 
	Version: @version
	Based in Josh Bush (digitalbush.com)
*/
(function($) {
	var pasteEventName = ($.browser.msie ? 'paste' : 'input') + ".hiska";
	var iPhone = (window.orientation != undefined);

	$.hiska = {
		//Predefined character definitions
		definitions: {
			'!': "[0-9,!¿?():;]",
			'+1': "[0-9,]",
			'-1': "[0-9,]",
			'9': "[0-9,]",
			'a': "[A-Za-z]",
			'*': "[A-Za-z0-9 ]"
		},
		dataName:"rawMaskFn"
	};
	$.fn.extend({
		//Helper Function for Caret positioning
		caret: function(begin, end) {
			if (this.length == 0) return;
			if (typeof begin == 'number') {
				end = (typeof end == 'number') ? end : begin;
				return this.each(function() {
					if (this.setSelectionRange) {
						this.setSelectionRange(begin, end);
					} else if (this.createTextRange) {
						var range = this.createTextRange();
						range.collapse(true);
						range.moveEnd('character', end);
						range.moveStart('character', begin);
						range.select();
					}
				});
			} else {
				if (this[0].setSelectionRange) {
					begin = this[0].selectionStart;
					end = this[0].selectionEnd;
				} else if (document.selection && document.selection.createRange) {
					var range = document.selection.createRange();
					begin = 0 - range.duplicate().moveStart('character', -100000);
					end = begin + range.text.length;
				}
				return { begin: begin, end: end };
			}
		},
		unmask: function() { return this.trigger("unmask"); },
		hiska: function(hiska, settings) {
			settings = $.extend({
				placeholder: "_",
				completed: null
			}, settings);

			var defs = $.hiska.definitions;
			var tests = [];
			var firstNonMaskPos = null;
			var min = $(this).attr('min');
			var max = $(this).attr('max');
			var type = $(this).attr('mask');
			var mask_ ='';
			var mask__ ='';
			var pl = $(this).attr('placeholder_'); 
			var dec = $(this).attr('dec');
			var point = 0;
			$(this).attr('holder_',pl); 
			if ($(this).attr('max')&&type!='date')
				if(type!='mask'){
					if(type!='cade'){				
						$(this).css({'text-align': 'right'});
						mask__ = pl.replace(/9/gi,'');
						point = parseInt((max.length-1)/3);
					}
					settings.placeholder = '';
					var index = type=='cade'?max:max.length; 
					index=point?index+point:index;
					if(dec){ dec++; index = index+dec;}
					for(var i=0;i<index;i++){ mask_=mask_+pl.charAt(0); }
					if(mask__)mask_=mask_+mask__;
					$(this).attr('holder_',mask_); 
				}	
			//$.each(mask.split(""), function(i, c) {
			$.each($(this).attr('holder_').split(""), function(i, c) {
				if (c == '?') {
					len--;
					partialPosition = i;
				} else if (defs[c]) {
					tests.push(new RegExp(defs[c]));
					if(firstNonMaskPos==null)
						firstNonMaskPos =  tests.length - 1;
				} else {
					tests.push(null);
				}
			});
			hiska = $(this).attr('holder_');
			var partialPosition = hiska.length;
			var len = hiska.length;
			if (!hiska && this.length > 0) {
				var input = $(this[0]);
				return input.data($.hiska.dataName);
			}

			return this.trigger("unmask").each(function() {
				var input = $(this);
				var buffer = $.map(hiska.split(""), function(c, i) { if (c != '?') return defs[c] ? settings.placeholder : c });
				var focusText = input.val();
				function checkdate (m, d, y) {
					var dt = new Date(parseInt(y, 10), parseInt(m, 10)-1, parseInt(d, 10));
					if(dt.getDate() != parseInt(d, 10) || dt.getMonth() != (parseInt(m, 10)-1) || dt.getFullYear() != parseInt(y, 10))
					return false; else return true; 
					//return m > 0 && m < 13 && y > 0 && y < 32768 && d > 0 && d <= (new Date(y, m, 0)).getDate();
				};
				function seekNext(pos) {
					while (++pos <= len && !tests[pos]);
					return pos;
				};
				function seekPrev(pos) {
					while (--pos >= 0 && !tests[pos]);
					return pos;
				};

				function shiftL(begin,end) {
					if(begin<0)
					   return;
					if(type!='int1'){ 
						for (var i = begin,j = seekNext(end); i < len; i++) {
							if (tests[i]) {
								if (j < len && tests[i].test(buffer[j])) {
									buffer[i] = buffer[j];
									buffer[j] = settings.placeholder;
								} else
									break;
								j = seekNext(j);
							}
						}
						
					}writeBuffer();
					input.caret(Math.max(firstNonMaskPos, begin));
				};

				function shiftR(pos) {
					for (var i = pos, c = settings.placeholder; i < len; i++) {
						if (tests[i]) {
							var j = seekNext(i);
							var t = buffer[i];
							buffer[i] = c;
							if (j < len && tests[j].test(t))
								c = t;
							else
								break;
						}
					}
				};

				function keydownEvent(e) {
					var k=e.which;
					//console.log(k);
					if(type=='int1' && k==8 && $(this).val()<=0){ return false;}
					//backspace, delete, and escape get special treatment
					if(k == 8 || k == 46 || (iPhone && k == 127)){
						//console.log(k);
						var pos = input.caret(),
							begin = pos.begin,
							end = pos.end;
						if(end-begin==0){
							begin=k!=46?seekPrev(begin):(end=seekNext(begin-1));
							end=k==46?seekNext(end):end;							
						}
						if(type=='int1'){ begin_=begin; end_=end; }			
						clearBuffer(begin, end);
						shiftL(begin,end-1);						
						if(type=='int1'){ 
							var aux = input.val();
							//console.log(aux+': b='+begin_+':e='+end_);
							if(aux[1]==','&& begin!=1){console.log('*'); begin_--;}
							numero = aux.replace(/\,/gi,'');
							//console.log(numero>0?'1':'0');
							//console.log(numero);
							
							//if(aux>0) {
								$(this).val(numero);
								//console.log(numero);
								point_ = parseInt((numero.length-1)/3);	
								for(var t=0;t<buffer.length;t++) buffer[t] = '';
								//console.log(buffer);
								for(var t=0;t<numero.length+point_-1;t++) if( t<buffer.length )buffer[t] = numero.charAt(t);
								hiskaInt(); 
								//console.log(begin_+','+end_);
								//if(dec){end_=end_-dec;}
								//console.log(aux+':'+aux[0]+'=="0" && '+aux[1]+'=="."');
								if(aux[1]=='.'){ 
									shiftL(begin_+1,end_);									
									if($(this).val()<=0){ 
										for(var t=0;t<buffer.length;t++) buffer[t] = ''; 
										writeBuffer(); 
										//console.log('*'); 
									}
								}else{ 
									shiftL(begin_,end_); 
								}
								//if(numero[0]=='0' && numero[1]=='.'){ begin_++; console.log(aux+': b='+begin_+':e='+end_);}
							/*}else{
								for(var t=0;t<buffer.length;t++) buffer[t] = '';
								//console.log(begin_+','+end_);
								shiftL(begin_,end_);
							}*/
						}
						return false;
					} else if (k == 27) {//escape
						input.val(focusText);
						input.caret(0, checkVal());
						return false;
					}
				};
				function hiskaFormat(num){
					num += '';
					var splitStr = num.split('.');
					var splitLeft = splitStr[0];
					var splitRight = splitStr.length > 1 ? '.' + splitStr[1] : '';
					var regx = /(\d+)(\d{3})/;
					while (regx.test(splitLeft)) {
						splitLeft = splitLeft.replace(regx, '$1' + ',' + '$2');
					}
					return splitLeft + splitRight;
				};
				function hiskaInt(){
					var	separadorDecimalesInicial = ".";
					var separadorDecimales = ".";
					var separadorMiles = ",";
					var aux = input.val();
					var numeroo = numeroo_ = "";
					var duffer = [];
					//console.log(aux);
					numero = "" + aux;
					numero = numero.replace(/\,/gi,'');
					cifras = numero.length;
					cifras2 = cifras;
					if(dec){
						if(numero.length==1){
							numeroo+='0.'; 
								for(var i=1;i<dec;i++) if(i==(dec-1))numeroo+=aux; else numeroo+='0'; 
						}else{
							numero = numero.replace(/\./gi,'');
							for(var t=0;t<numero.length;t++) if(numero.charAt(t)!='0'){ numero = numero.substr(t,numero.length);  break;}
							//for(var t=0;t<len;t++) buffer[t] = '';
							point = parseInt((max.length-1)/3);
							numero = numero.substr(0,len-point-1);
							var _i = numero.length-1;
							var i_ = 0;
							for(var t=len-1;t>=0;t--){
								if(i_ == dec-1){
									duffer[t] = '.';
									t--;
									duffer[t] = numero.charAt(_i);								
								}else{
									duffer[t] = numero.charAt(_i);
								}	
								_i--;
								i_++;
							}
							for(var t=0;t<duffer.length-1;t++){
								if(duffer[t+1]=='.'){
									if(duffer[t]==''){
										duffer[t]='0';
										//console.log('*');
										for(var t_=t;t_<duffer.length-1;t_++)
											if(duffer[t_]=='') duffer[t_]='0';
										break;
									}
								}
							}
							//console.log(numero+'='+duffer.join(''));
							numeroo = duffer.join('');
							numeroo = hiskaFormat(numeroo);
							//console.log(numeroo);
							
							for(var t=0;t<len;t++) buffer[t] = '';
						}
						
						for(var t=0;t<numeroo.length;t++) buffer[t] = numeroo.charAt(t);
						writeBuffer();
						return true; 
					}else{
						for (a = 0; a < cifras; a++) {
							cifras2 -= 1;
							numeroo += numero.charAt(a); 						
							if(cifras2%3==0 &&cifras2!=0){
								numeroo+=separadorMiles; 
							}  
						}
						point_ = parseInt((aux.length-1)/3);		
						for(var t=0;t<aux.length+point_;t++) if( t<buffer.length )buffer[t] = numeroo.charAt(t);
						for(var t=0;t<aux.length+point_;t++) if( buffer[t]>0 ) break; else buffer[t] = '';
						writeBuffer();
						if(point_>0) return true; else return false;
					}					
				};
				function keypressEvent(e) {
					var k = e.which,
						pos = input.caret();
					if (e.ctrlKey || e.altKey || e.metaKey || k<32) {//Ignore
						return true;
					} else if (k) {
						if(pos.end-pos.begin!=0){
							clearBuffer(pos.begin, pos.end);
							shiftL(pos.begin, pos.end-1);
						}
						var p = seekNext(pos.begin - 1);
						if (p < len) {
							var c = String.fromCharCode(k);
							if (tests[p].test(c)) {
								shiftR(p);
								/*buffer[p] = c;
								console.log(p+':'+buffer);
								writeBuffer();*/
								switch(type){
										case 'date':								
											switch(p){
											case 0:	if(c<=3){buffer[p] = c;	writeBuffer(); }else{ return false; } break;
											case 1:	if(buffer[0]+c<=31){ buffer[p] = c;	writeBuffer(); }else{ return false;	} break;
											case 3:	if(c<=1){ buffer[p] = c; writeBuffer(); }else{ return false; } break;
											case 4:	if(buffer[3]+c<=12){ buffer[p] = c;	writeBuffer(); }else{ return false; } break;
											case 6:	if(c<=max.charAt(0)&&c>=min.charAt(0)){ buffer[p] = c; writeBuffer(); }else{ return false; }break;
											case 7: if(c<=max.charAt(1)&&c>=min.charAt(1)){ buffer[p] = c; writeBuffer(); }else{ return false; }break;
											case 8: if(c<=max.charAt(2)&&c>=min.charAt(2)){ buffer[p] = c; writeBuffer(); }else{ return false; } break;
											case 9: if(c<=max.charAt(3)&&c>=min.charAt(3)){ buffer[p] = c; writeBuffer(); }else{ return false; } break;
											default: buffer[p] = c; writeBuffer();
											}
											var my = $(this).val();
											if(my!=''){
												my = my.split('/');
												if (checkdate (my[1], my[0], my[2])) $(this).removeClass('error'); else $(this).addClass('error');
											}
										break;	
										case 'int1':
											if(c!=',')buffer[p] = c; 
											writeBuffer(); 
											var leng = input.val().length-1;
											var sw = hiskaInt(); 
											if(sw && p == leng) p++; 
											//console.log(p);
											//console.log(buffer[p]+':'+buffer[p+1]+':'+dec);
											if((buffer[p]=='.' && buffer[p+1]=='0') || (buffer[p]=='.' && buffer[p+1]=='1' && dec-1==1)) p=p+dec; else if(buffer[p]=='.') p++;
											//if(sw && dec) p=p+dec;
											
											if(buffer[p]==',') p++;	
										break;
										default: buffer[p] = c; writeBuffer();
									}
								var next = seekNext(p);
								input.caret(next);
								if (settings.completed && next >= len)
									settings.completed.call(input);
							}
						}
						return false;
					}
				};

				function clearBuffer(start, end) {
					for (var i = start; i < end && i < len; i++) {
						if (tests[i])
							buffer[i] = settings.placeholder;
					}
				};

				function writeBuffer() { return input.val(buffer.join('')).val(); };

				function checkVal(allow) {
					//try to place characters where they belong
					var test = input.val();
					var lastMatch = -1;
					for (var i = 0, pos = 0; i < len; i++) {
						if (tests[i]) {
							buffer[i] = settings.placeholder;
							while (pos++ < test.length) {
								var c = test.charAt(pos - 1);
								if (tests[i].test(c)) {
									buffer[i] = c;
									lastMatch = i;
									break;
								}
							}
							if (pos > test.length)
								break;
						} else if (buffer[i] == test.charAt(pos) && i!=partialPosition) {
							pos++;
							lastMatch = i;
						}
					}
					if (!allow && lastMatch + 1 < partialPosition) {
						input.val("");
						clearBuffer(0, len);
					} else if (allow || lastMatch + 1 >= partialPosition) {
						writeBuffer();
						if (!allow) input.val(input.val().substring(0, lastMatch + 1));
					}
					return (partialPosition ? i : firstNonMaskPos);
				};

				input.data($.hiska.dataName,function(){
					return $.map(buffer, function(c, i) {
						return tests[i]&&c!=settings.placeholder ? c : null;
					}).join('');
				})

				if (!input.attr("readonly"))
					input
					.one("unmask", function() {
						input
							.unbind(".hiska")
							.removeData($.hiska.dataName);
					})
					.bind("focus.hiska", function() {
						if(type!='int1'){
							focusText = input.val();
							var pos = checkVal();
							writeBuffer();
							var moveCaret=function(){
								if (pos == hiska.length)
									input.caret(0, pos);
								else
									input.caret(pos);
							};
							($.browser.msie ? moveCaret:function(){setTimeout(moveCaret,0)})();
						}
					})
					.bind("blur.hiska", function() {
						if(type!='int1'){
							checkVal();
							if (input.val() != focusText)
								input.change();
						}	
					})
					.bind("keydown.hiska", keydownEvent)
					.bind("keypress.hiska", keypressEvent)
					.bind(pasteEventName, function() {
						setTimeout(function() { input.caret(checkVal(true)); }, 0);
					});
				checkVal(); //Perform initial check for existing values
			});
		}
	});
})(jQuery);