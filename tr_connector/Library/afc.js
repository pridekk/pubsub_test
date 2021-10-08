afc = {};

//상속처리
afc.extendsClass = function(childClass, parentClass)
{
	//이미 상속처리가 되어져 있는 경우는 리턴
	if(childClass.prototype.superClass) return;
	if(!parentClass)
	{
		console.error('extendsClass : parentClass is not defined.');
		return;
	}

	//상속 받을 부모의 프로토 타입 객체를 생성한다.
	var superProto = new parentClass(); //파라미터 없이 호출한다.
	for(var p in superProto) 
    	if(superProto.hasOwnProperty(p)) delete superProto[p];
	childClass.prototype = superProto;
	childClass.prototype.constructor = childClass;
	childClass.prototype.superClass = parentClass;
};

afc.trim = function(text){
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

    return text == null ?
        "" :
        ( text + "" ).replace( rtrim, "" );
}

module.exports = afc;