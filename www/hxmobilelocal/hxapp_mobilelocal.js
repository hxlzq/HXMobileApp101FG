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
    var strTemp = HXMobileJS._Internal.get_global_config("chosen_language");
    if (strTemp != null && strTemp != "") strChosenLanguage = strTemp;
    return strChosenLanguage;
}

HXMobileJS.register_new_system = function (strSystemName, strServerAddress, strLoginServerAddress, blnSetAsChosenSystem)
{
    var intNewSystemId = HXMobileJS._Internal.get_new_system_id();
    HXMobileJS._Internal.insert_new_system(intNewSystemId, strSystemName, strServerAddress, strLoginServerAddress);
    if (blnSetAsChosenSystem) HXMobileJS._Internal.set_global_config("chosen_system_id", intNewSystemId);
    return intNewSystemId;
}


HXMobileJS.update_system_config_info = function(intSystemId, strSystemName, strServerAddress, strLoginServerAddress)
{
    if (window.localStorage == null) return null;
    var strTemp = window.localStorage.getItem("hxmobile_system_list");
    if (strTemp == null || strTemp == "") return null;

    var objRegistedSystemList = $.parseJSON(strTemp);
    var objSystemConfigInfo = null, objTemp;
    for (var i = 0; i < objRegistedSystemList.length; i++) {
        objTemp = objRegistedSystemList[i];
        if (objTemp.system_id == intSystemId) { objSystemConfigInfo = objTemp; break; }
    }

    if (objSystemConfigInfo == null) return;

    if (strServerAddress == null || strServerAddress == "") return null;

    // server address 和login server address 规范化
    strServerAddress = HXMobileJS._Internal._format_full_server_address(strServerAddress);

    if (strLoginServerAddress == null || strLoginServerAddress == "")
        strLoginServerAddress = strServerAddress;
    else
        strLoginServerAddress = HXMobileJS._Internal._format_full_server_address(strLoginServerAddress);

    objSystemConfigInfo.system_name = strSystemName;
    objSystemConfigInfo.server_address = strServerAddress;
    objSystemConfigInfo.login_server_address = strLoginServerAddress;

    window.localStorage.setItem("hxmobile_system_list", JSON.stringify(objRegistedSystemList));
}

HXMobileJS.remove_system = function(intSystemId)
{
    if (window.localStorage == null) return null;
    var strTemp = window.localStorage.getItem("hxmobile_system_list");
    if (strTemp == null || strTemp == "") return null;

    var objRegistedSystemList = $.parseJSON(strTemp);
    var objSystemConfigInfo = null, objTemp;
    for (var i = 0; i < objRegistedSystemList.length; i++) {
        objTemp = objRegistedSystemList[i];
        if (objTemp.system_id == intSystemId) { objSystemConfigInfo = objTemp; break; }
    }

    if (objSystemConfigInfo == null) return null;

    objRegistedSystemList.splice(i, 1);

    window.localStorage.setItem("hxmobile_system_list", JSON.stringify(objRegistedSystemList));

    return objSystemConfigInfo;
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

HXMobileJS.get_registed_system_list = function()
{
    if (window.localStorage == null) return null;
    var strTemp = window.localStorage.getItem("hxmobile_system_list");
    if (strTemp == null || strTemp == "") return null;

    return $.parseJSON(strTemp);
}

HXMobileJS.auto_login_process = function (intSystemId, fnCallbackWhenOffLine, blnCallFromRootPath)
{
    var objSystemSetting = HXMobileJS.get_registed_system_info(intSystemId);
    if (objSystemSetting == null) return;

    var fnCallbackOnline = function()
    {
        var strUserCode = HXMobileJS._Internal.get_global_config("last_access_user_code");
        var strAccessTokenCode = HXMobileJS._Internal.get_global_config("last_access_token_code");

        if (strUserCode == null || strUserCode == "" || strAccessTokenCode == null || strAccessTokenCode == "") {
            // 自动令牌登录信息不足，转入登录页面
            window.open( (blnCallFromRootPath ? "" : "../") + "hxmobilelocal/hxapp_login.htm?system_id=" + intSystemId, "_self");
            return;
        }

        var objResult = HXWebXmlService.LoginByTokenProcess(strUserCode, strAccessTokenCode);

        if (objResult != null) {
            var strNewAccessTokenCode = objResult.access_token_code;
            var strNewCultureCode = objResult.culture_code;

            HXMobileJS._Internal.set_global_config("chosen_system_id", intSystemId);
            HXMobileJS._Internal.set_global_config("last_access_user_code", strUserCode);
            HXMobileJS._Internal.set_global_config("last_access_token_code", strNewAccessTokenCode);
            HXMobileJS._Internal.set_global_config("chosen_language", strNewCultureCode);

            HXMobileJS.navigate_to_system_homepage(objSystemSetting.server_address, strUserCode, strNewAccessTokenCode, ""
                                , objSystemSetting.opened_in_container, blnCallFromRootPath);
        }
        else {
            // 到登录页
            window.open((blnCallFromRootPath ? "" : "../") + "hxmobilelocal/hxapp_login.htm?system_id=" + intSystemId, "_self");
        }
    }


    // 设置登录服务器地址，以便AJAX登录处理
    gstrWebRootPath = objSystemSetting.login_server_address;

    HXWebXmlService.IsOnline(fnCallbackOnline, fnCallbackWhenOffLine);
}

HXMobileJS.navigate_to_system_homepage = function (strServerAddress, strUserCode, strAccessTokenCode, strTargetHomePage, blnOpenInContainer, blnCallFromRootPath)
{
    blnOpenInContainer = false; // 经测试，phonegap下本地页面嵌套远程页面时对远程页面的设备调用问题较多，所以此处总是使用直接远程页面访问机制

    if ( blnOpenInContainer == true)
    {
        var strFullUrl = strServerAddress + "hxpublic_v6/hxssoservice.aspx?login_user_code=" + strUserCode 
                + "&access_token_code=" + strAccessTokenCode + "&target_web_page=" + strTargetHomePage;

        window.open((blnCallFromRootPath ? "" : "../") + "hxmobilelocal/hxapp_system_container.htm?system_full_url=" + escape(strFullUrl));

    }
    else
    {
        HXWebNavigation.PostDataToWebPage(strServerAddress + "hxpublic_v6/hxssoservice.aspx", "_self"
                            , "login_user_code", strUserCode, "access_token_code", strAccessTokenCode
                            , "target_web_page", strTargetHomePage);
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

    var objSystemConfigInfo = { system_id: intNewSystemId, system_name: strSystemName
                                , server_address: strServerAddress, server_address_2: null
                                , server_homepage: strServerHomePage
                                , login_server_address: strLoginServerAddress
                                , login_user: null, login_token: null, login_token_create_time: null
    };
        
    var strRegistedSystemJSONList = window.localStorage.getItem("hxmobile_system_list");

    var objRegistedSystemList;
    if (strRegistedSystemJSONList == null || strRegistedSystemJSONList == "")
    {
        objRegistedSystemList = [];
    }
    else
        objRegistedSystemList = $.parseJSON(strRegistedSystemJSONList);

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