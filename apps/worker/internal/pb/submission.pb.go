package pb

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
)

type ReportResultRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	SubmissionId string `protobuf:"bytes,1,opt,name=submissionId,proto3" json:"submissionId,omitempty"`
	Status       string `protobuf:"bytes,2,opt,name=status,proto3" json:"status,omitempty"`
	TimeTakenMs  int64  `protobuf:"varint,3,opt,name=timeTakenMs,proto3" json:"timeTakenMs,omitempty"`
	ErrorLog     string `protobuf:"bytes,4,opt,name=errorLog,proto3" json:"errorLog,omitempty"`
	Token        string `protobuf:"bytes,5,opt,name=token,proto3" json:"token,omitempty"`
}

func (x *ReportResultRequest) Reset() {
	*x = ReportResultRequest{}
}

func (x *ReportResultRequest) String() string {
	return x.SubmissionId
}

func (*ReportResultRequest) ProtoMessage() {}

func (x *ReportResultRequest) ProtoReflect() protoreflect.Message {
	return protoimpl.X.MessageOf(x)
}

type ReportResultResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Success bool   `protobuf:"varint,1,opt,name=success,proto3" json:"success,omitempty"`
	Message string `protobuf:"bytes,2,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *ReportResultResponse) Reset() {
	*x = ReportResultResponse{}
}

func (x *ReportResultResponse) String() string {
	return x.Message
}

func (*ReportResultResponse) ProtoMessage() {}

func (x *ReportResultResponse) ProtoReflect() protoreflect.Message {
	return protoimpl.X.MessageOf(x)
}
