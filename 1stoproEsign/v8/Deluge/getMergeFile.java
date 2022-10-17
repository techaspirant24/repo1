moduleName = crmAPIRequest.get("params").get("module");
recordId = crmAPIRequest.get("params").get("recordId");
fileName = crmAPIRequest.get("params").get("fileName");
mailMerge_templateId = crmAPIRequest.get("params").get("templateId");
info "ModuleName :: " + moduleName;
info "templateId :: " + mailMerge_templateId;
mergeFile = zoho.crm.getMergedFile(moduleName,recordId,mailMerge_templateId);
getPrefixName = fileName.getPrefix('.');
checkExtension = fileName.getSuffix(".");
info mergeFile;
info getPrefixName;
info checkExtension;
if(checkExtension == "zdoc")
{
	newFileName = getPrefixName + ".docx";
	info newFileName;
	mergeFile.setFileName(newFileName);
}
else
{
	info fileName;
	mergeFile.setFileName(fileName);
}
mergeFile.setParamName("content");
info mergeFile;
filesMap = Map();
filesMap.put("file",mergeFile);
dynamic_map = Map();
dynamic_map.put("CRMAPIFILES",filesMap);
info dynamic_map;
uploadFileResp = zoho.crm.invokeConnector("zohosign.uploadfile",dynamic_map);
info uploadFileResp;
return uploadFileResp;