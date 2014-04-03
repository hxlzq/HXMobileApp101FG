var HXWebJS;
if (!HXWebJS) HXWebJS = {};
HXWebJS.Mobile = {};
var HXMobileJS = HXWebJS.Mobile;

HXMobileJS.get_current_chosen_system_id = function()
{
    return HXMobileJS._Internal.get_global_config("chosen_system_id");
}
HXMobileJS.get_curren_chosen_language = function()
{
    var strChosenLanguage = "zh-cn";
    var strTemp = HXMobileJS.get_global_config("chosen_language");
    if (strTemp != null && strTemp != "") strChosenLanguage = strTemp;
    return strChosenLanguage;
}

HXMobileJS.register_new_system = function(strSystemName, strServerAddress, strLoginServerAddress, blnSetAsChosenSystem)
{
    var intNewSystemId = HXMobileJS._Internal.get_new_system_id();
    HXMobileJS._Internal.insert_new_system(intNewSystemId, strSystemName, strServerAddress, strLoginServerAddress);

    if (blnSetAsChosenSystem) HXMobileJS._Internal.set_global_config("chosen_system_id", intNewSystemId);
    
    return intNewSystemId;
}

HXMobileJS.get_registed_system_info = function(intSystemId)
{
    if (window.localStorage == null) return null;
    var strTemp = window.localStorage.getItem("hxmobile_system_list");
    if (strTemp == null || strTemp == "") return null;

    var objRegistedSystemList = $.parseJSON(strTemp);
    var objTemp;
    for (var i = 0; i < objRegistedSystemList.length; i++)
    {
        objTemp = objRegistedSystemList[i];
        if (objTemp.system_id == intSystemId) return objTemp;
    }
}

HXMobileJS.parseUrlParameters = function()
{
    var arrTemp = document.URL.split("?");
    if (arrTemp.length < 2) return null;
    var strTemp = arrTemp[1];
    if (strTemp == "") return null;
    arrTemp = strTemp.split("&");
    var objUrlParameters = {};
    var arr, strParamName, strParamValue;
    for (var i=0; i<arrTemp.length; i++)
    {
        strTemp == $.trim(arrTemp[i]);
        if (strTemp == "") continue;
        arr = strTemp.split("=");
        strParamName = arr[0];
        strParamValue = arr[1];
        objUrlParameters[strParamName] = unescape(strParamValue);
    }
    return objUrlParameters;
}

HXMobileJS.try_to_auto_login = function(intSystemId)
{
    // 1 如果登录服务器地址被设置，则使用该值，否则使用服务器地址作为登录服务器地址
    // 2 登录服务器地址加上 /hxpublic_v6/hxxmlservice_v6.aspx作为AJAX访问地址
    // 3 构造
}

HXMobileJS.goto_system_homepage = function(intSystemId)
{
}

HXMobileJS._Internal = {};
HXMobileJS._Internal.get_global_config = function(strConfigCode)
{
    if (strConfigCode == null || strConfigCode == "") return null;
    if (window.localStorage == null) return null;
    var strConfigData = window.localStorage.getItem("hxmobile_global_config");
    if (strConfigData == null || strConfigData == "") return null;

    var objConfig = $.parseJSON(strConfigData);
    return objConfig[strConfigCode];
}
HXMobileJS._Internal.set_global_config = function(strConfigCode, strConfigValue)
{
    if (strConfigCode == null || strConfigCode == "") return;
    if (window.localStorage == null) return;
    var strConfigData = window.localStorage.getItem("hxmobile_global_config");

    var objConfigInfo;
    if (strConfigData == null)
        objConfigInfo = {};
    else
        objConfigInfo = $.parseJSON(strConfigData);

    objConfigInfo[strConfigCode] = strConfigValue;
    window.localStorage.setItem("hxmobile_global_config", JSON.stringify(objConfigInfo));
}
HXMobileJS._Internal.get_new_system_id = function()
{
    if (window.localStorage == null) return null;
    var strData = window.localStorage.getItem("hxmobile_system_list");
    if (strData == null) return 1;

    var objRegistedSystemList = $.parseJSON(strData);

    var intTempMaxUsedId = 0;
    for (var i = 0; i < objRegistedSystemList.length; i++)
    {
        if (objRegistedSystemList[i].system_id > intTempMaxUsedId) intTempMaxUsedId = objRegistedSystemList[i].system_id;
    }

    return intTempMaxUsedId+1;
}
HXMobileJS._Internal.insert_new_system = function (intNewSystemId, strSystemName, strServerAddress, strLoginServerAddress, strServerHomePage)
{
    if (window.localStorage == null) return null;

    if (strServerAddress == null || strServerAddress == "") return null;

    if (strServerHomePage == null) strServerHomePage = "";


    // server address 和login server address 规范化
    strServerAddress = HXMobileJS._Internal._format_full_server_address(strServerAddress);

    if (strLoginServerAddress == null || strLoginServerAddress == "")
        strLoginServerAddress = strServerAddress;
    else
        strLoginServerAddress = HXMobileJS._Internal._format_full_server_address(strLoginServerAddress);
        
    var strRegistedSystemJSONList = window.localStorage.getItem("hxmobile_system_list");

    var objRegistedSystemList;
    if (strRegistedSystemJSONList == null || strRegistedSystemJSONList == "")
    {
        objRegistedSystemList = [];
    }
    else
        objRegistedSystemList = $.parseJSON(strRegistedSystemJSONList);

    var objSystemConfigInfo = { system_id: intNewSystemId, system_name: strSystemName
                                , server_address: strServerAddress, server_address_2: null
                                , server_homepage: strServerHomePage
                                , login_server_address: strLoginServerAddress
                                , login_user: null, login_token: null, login_token_create_time: null
    };

    objRegistedSystemList.push(objSystemConfigInfo);

    window.localStorage.setItem("hxmobile_system_list", JSON.stringify(objRegistedSystemList));
}


HXMobileJS._Internal._format_full_server_address = function (strServerAddress)
{
    strServerAddress = strServerAddress.toLowerCase();
    if (strServerAddress.indexOf("http") == -1)
    {
        // 输入的地址没有http(s)前缀，此时视作http协议
        strServerAddress = "http://" + strServerAddress;
    }

    // 确保有/后缀
    if (strServerAddress.substr(strServerAddress.length - 1) != "/") strServerAddress += "/";
    
    return strServerAddress;
}