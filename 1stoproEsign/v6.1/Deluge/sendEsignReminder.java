signDocRecId = sign_documents.get("ZohoSign_Documents.ID");
//signDocRecId = "4479873000000274065";
info signDocRecId;
recDetails = zoho.crm.getRecordById("ZohoSign_Documents",signDocRecId);
signReqId = recDetails.get("Sign_Request_ID");
docuStatus = recDetails.get("Document_Status");
if(!"INPROGRESS".equalsIgnoreCase(docuStatus) || signReqId.isNull() || signReqId.isEmpty())
{
	if(signReqId.isNull() || signReqId.isEmpty())
	{
		return "E-Sign Request Id is not found, Can't send Reminder";
	}
	return "E-Sign Document Status is " + docuStatus + " So, Can't send Reminder";
}
dynamic_map = Map();
//Map all dynamic params to your desired values 
dynamic_map.put("reqId",signReqId);
dynamic_map.put("remind","remind");
remindResp = zoho.crm.invokeConnector("zohosign.remindrecipient",dynamic_map);
info "remindResp is :: " + remindResp;
status = remindResp.get("status_code");
if(status >= 200 && status < 300)
{
	response = remindResp.get("response").toMap();
	remindMsg = response.get("message");
	return remindMsg;
}
return "Reminder Failed";
//lName = recDetails.get("Last_Name");
//phone = recDetails.get("Phone");
