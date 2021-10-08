var fs = require('fs');
const afc = require("./afc.js");
/**
 * @author asoocool
 */

const { fstat } = require("fs");


/*
this.query = 
{
	"meta":
	{
	},
	
	"name": "obcpp_logn_101a",
	"queryType": ".STRT" or .SFID or .BFID
	"pattern": 1,//"단순조회"
	"mids":[1],
	
	"input":
	{
		"InBlock1":
		{
			//"type": "input",
			"format":
			[
				//설명,필드키,FID,custom,데이터형,사이즈,지수
				[단축코드,D1단축코드,16013,,string,16,0],
				...
			]
		},
		
		...
	},
	
	"output":
	{
		"OutBlock1":
		{
			//"type": "output",
			"format":
			[
				//설명,필드키,FID,기본값,데이터형,사이즈,지수
	    		[현재가,D1현재가,15001,,ULONG,4,-2], 
				...
			]
		},
		
		...
	}
};

*/

function AQuery()
{
	this.query = null;
	
	//쿼리와 연결된 컴포넌트
	this.queryComps = {};
}

//-------------------------------------------------------------
//	static area
//

//AQuery.FORMAT = 'res';	//qry, xml, res
//AQuery.FORMAT = 'qry';	//qry, xml, res

// [ 단축코드, D1단축코드, 16013, 105, STRING, 16, 0 ],
AQuery.IDESC = 0;
AQuery.IKEY = 1;
AQuery.IFID = 2;
AQuery.IVALUE = 3;
AQuery.ITYPE = 4;
AQuery.ISIZE = 5;
AQuery.IEXP = 6;


//데이터 타입 문자열을 숫자 상수로 지정
//ABuffer 의 getType 의 파라미터로 넣기 위해
AQuery.BINARY = -2;
AQuery.STRING = -1;
AQuery.UNSIGNED = 1;
AQuery.SIGNED = 0;

//로드된 쿼리 풀
AQuery.queryMap = {};
AQuery.getQuery = function(qryName) { return AQuery.queryMap[qryName]; };
AQuery.setQuery = function(qryName, aquery) { AQuery.queryMap[qryName] = aquery; };

AQuery.path = 'Query/';

//AQuery.queryCallbacks = {};

AQuery.setQueryFormat = function(format) 
{
	if(format=='res-v1')
	{
		AQuery.OLD_RES_PARSE = true;
		format = 'res';
	}
	else AQuery.OLD_RES_PARSE = false;
	
	
	AQuery.FORMAT = format;
};


AQuery.getSafeQuery = function(qryName)
{
	if(!qryName) return null;
	
	var cQryName = qryName.substring(qryName.indexOf('/')+1);
	var aquery = AQuery.getQuery(cQryName);
	
	//쿼리맵에 없으면 로드
	if(!aquery)
	{
		aquery = new AQuery();
		
		aquery.loadQuery(AQuery.path + qryName+'.'+AQuery.FORMAT, false, function(success)
		{
			//if(!success) alert('load fail : Query/'+qryName+'.'+AQuery.FORMAT);
			
			if(success) AQuery.setQuery(cQryName, aquery);
			else 
			{
				theApp.onError('load fail! : Query/'+qryName+'.'+AQuery.FORMAT, 'AQuery', -1, -1, {});
				console.error('load fail! : Query/'+qryName+'.'+AQuery.FORMAT);
				//console.log('load fail! : Query/'+qryName+'.'+AQuery.FORMAT);
				aquery = null;
			}
		});
	}
	
	return aquery;
};

//프로젝트 설정에 따라 값을 셋팅함
AQuery.setQueryFormat('res-v1');


/*
0 번째 자리에 name 셋팅, mid 값이 1부터 시작하므로
AQuery.fidInfoMap = 
{
	'16013':
	[
		'D1단축코드', ['SHORT',4,-2],,,,,,,['STRING',6,0] --> mid 개수만큼
	]
};
*/

//--------------------------------------------------------------

AQuery.prototype.loadQuery = function(url, isAsync, callback)
{
	result = fs.readFileSync(url, 'utf8');
	if(result) {
		this.query = AQuery.parseQuery(result);
		if(callback) callback.call(this, true);
	}
	/*
    $.ajax(
    {
    	async:isAsync, url: url, dataType: 'text',
        success: function(result)
        {
			if(result) 
			{
				thisObj.query = AQuery.parseQuery(result);
        		if(callback) callback.call(thisObj, true);
			}
			else if(callback) callback.call(thisObj, false);
        },
        
        error: function()
        {
        	if(callback) callback.call(thisObj, false);
        }
    });
	*/
};

AQuery.parseQuery = function(strQuery)
{
	try
	{
		var func = AQuery['parse_'+AQuery.FORMAT];

		if(func) return func.call(this, strQuery);
		else alert('There is no parse function : parse_' + AQuery.FORMAT);
	}
	catch(err) 
	{
		console.log('AQuery.parseQuery : ' + err.message);
		console.log(strQuery);	
	}

	return null;
};

//-----------------------------
//	strQuery res format
AQuery.parse_res = function(strQuery)
{
	var block, lines = strQuery.split(/\r?\n+/g), line, info, area, fmtArr, arr, inCnt = 0, outCnt = 0, tmp,
		data = {}, inout, startStrArr = [
			'BEGIN_FUNCTION_MAP',
			'BEGIN_DATA_MAP',
			'begin',
			'end',
			'END_DATA_MAP',
			'END_FUNCTION_MAP'
		];
		
	var mode, i, j, k, tmp, sType;
	for(i=0; i<lines.length; i++)
	{
		line = afc.trim(lines[i]);
		if(!line) continue;
		
		tmp = startStrArr.indexOf(line);
		if(tmp > -1)
		{
			mode = tmp;
			continue;
		}
		
		info = line.split(';')[0].split(',');
		
		for(k=0; k<info.length; k++)
			info[k] = afc.trim(info[k]);
		
		//BEGIN_FUNCTION_MAP
		if(mode == 0)
		{
			//----------------------------------------------------
			//	.Func, (i0001)현재가조회TR, i0001, headtype=B;
			
			data.queryType = info[0];
			data.desc = info[1];
			data.name = info[2];
			
			//존재하는 경우만 셋팅
			for(j=3; j<info.length; j++)
			{
				tmp = info[j].split('=');
				data[tmp[0]] = tmp[1]?tmp[1]:true;
			}
		}
		
		// before begin
		else if(mode == 1 || mode == 3)
		{
			//----------------------------------------------------
			//	info --> i0001Out1,출력,output,occurs;
			//if(info[2].indexOf('input') > -1) inout = 'input';
			if(line.includes('input')) inout = 'input';
			else inout = 'output';
			
			if(!data[inout]) area = data[inout] = {};
			//if(!data[info[2]]) area = data[info[2]] = {};
			
			//res 버전에 따라 셋팅 방식을 다르게 분기
			if(AQuery.OLD_RES_PARSE)
			{
 				if(inout=='input') block = area['InBlock'+(++inCnt)] = {};
 				else if(inout=='output') block = area['OutBlock'+(++outCnt)] = {};
			}
			else
			{
				block = area[info[0]] = {};
			}
			
			//추가 다른 정보가 있는 경우에도 값이 파싱되어야하므로 추가(ex. occursRef)
			for(j=3; j<info.length; j++)
			{
				tmp = info[j].split('=');
				if (tmp[1]) block[tmp[0]] = tmp[1];
				else block[tmp[0]] = true;
			}
			
			fmtArr = block['format'] = [];
			block.desc = info[1];
			
			//occurs 정보 저장
			//if(info[3])
			if(line.includes('occurs'))
			{
				if(data['headtype']=='A') block['occurs'] = 'rsp_cnt';
				else block['occurs'] = 'out_cnt';
			
				//block['occurs'] = true;

				//tmp = info[3].split('=');
				//if(tmp[1] > 1) block[tmp[0]] = tmp[1];
			}
		}
		
		//begin
		else if(mode == 2)
		{
			//설명,필드키,FID,custom,데이터형,사이즈,지수
			tmp = info[4].split('.');
			
			sType = info[3];
			
			if(sType=='binary') sType = AQuery.BINARY;
			else if(sType=='char') sType = AQuery.STRING;
			else sType = AQuery.SIGNED;
			
			arr = [ info[0], info[2], undefined, undefined, sType, parseInt(tmp[0], 10), tmp[1]?parseInt(tmp[1], 10):0 ];
			fmtArr.push(arr);
		}
	}
	return data;
};

AQuery.prototype.getTypeIndex = function(mid)
{
	if(mid==AQuery.REP_MARKET) return AQuery.ITYPE;
	
	var mids = this.getValue('mids');
	
	for(var i=0; i<mids.length; i++)
	{
		if(mids[i]==mid) return AQuery.ITYPE + (3 * i);
	}
	
	var log = console.log(mid + ' : 존재하지 않는 타입입니다. 임시로 첫번째값으로 처리합니다. (mid 한정 요망)');
	if(log) alert(log);
	
	return AQuery.ITYPE;
};


AQuery.prototype.getName = function() { return this.query.name; };
AQuery.prototype.getMeta = function() { return this.query.meta; };
AQuery.prototype.getQueryType = function() { return this.query.queryType; };
AQuery.prototype.getRealType = function() { return this.query.realType; };

AQuery.prototype.getTrType = function() { return this.query.trType; };
AQuery.prototype.getIoVer = function() { return this.query.resourceVersion; };

AQuery.prototype.getValue = function(key) { return this.query[key]; };

AQuery.prototype.getQueryBlock = function(type, blockName)
{
	return this.query[type][blockName];
};

//type is input/output/nextflag, null is both
AQuery.prototype.eachQueryBlock = function(type, callback)
{
	var blocks = this.query[type];
	
	for(var name in blocks)
       	callback.call(this, name, blocks[name]);
};

AQuery.prototype.addQueryComp = function(containerId, type, acomp)
{
	var compArray = this.queryComps[containerId];
	if(!compArray) 
	{
		compArray = this.queryComps[containerId] = { 'input':[], 'output':[] };
	}
	
	compArray[type].push(acomp);
};

AQuery.prototype.removeQueryComp = function(containerId, type, acomp)
{
	var compArray = this.queryComps[containerId];
	if(!compArray) return;
	
	var typeArr = compArray[type];
	for(var i=0; i<typeArr.length; i++)
	{
		if(typeArr[i]===acomp)
		{
			typeArr.splice(i, 1);
			return;
		}
	}
};

AQuery.prototype.getQueryComps = function(containerId, type)
{
	var comps = this.queryComps[containerId];
	if(comps) return comps[type];
	else return null;
};

/*
AQuery.prototype.hasQueryDataKey = function(type, blockName, queryData)
{
	var block = this.getQueryBlock(type, blockName);
	var key, len = block.format.length;
	var blockData = queryData.getBlockData(blockName)[0];
	
	for(var i=0; i<len; i++)
	{
		key = block.format[i][AQuery.IKEY];
		if(blockData[key]) return true;
	}
	
	return false;
};
*/

//!! 주의 !!
//이 함수는 자신이 사용하는 fid key 가 있는지만을 체크한다.
//자신과 관계없는 fid 가 다수 있어도 자신과 관계 있는 fid 가 하나라도 있으면 true 를 리턴한다.
AQuery.prototype.hasQueryDataKey = function(queryData)
{
	var block = this.getQueryBlock('output', 'OutBlock1');
	var key, len = block.format.length;
	var blockData = queryData.getBlockData('OutBlock1')[0];
	
	for(var i=0; i<len; i++)
	{
		key = block.format[i][AQuery.IKEY];
		if(blockData[key]!=undefined) return true;
	}
	
	return false;
};

module.exports = AQuery;