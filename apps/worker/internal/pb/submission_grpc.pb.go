package pb

import (
	context "context"

	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

const _ = grpc.SupportPackageIsVersion7

type SubmissionServiceClient interface {
	ReportResult(ctx context.Context, in *ReportResultRequest, opts ...grpc.CallOption) (*ReportResultResponse, error)
}

type submissionServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewSubmissionServiceClient(cc grpc.ClientConnInterface) SubmissionServiceClient {
	return &submissionServiceClient{cc}
}

func (c *submissionServiceClient) ReportResult(ctx context.Context, in *ReportResultRequest, opts ...grpc.CallOption) (*ReportResultResponse, error) {
	out := new(ReportResultResponse)
	err := c.cc.Invoke(ctx, "/submission.SubmissionService/ReportResult", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

type SubmissionServiceServer interface {
	ReportResult(context.Context, *ReportResultRequest) (*ReportResultResponse, error)
	mustEmbedUnimplementedSubmissionServiceServer()
}

type UnimplementedSubmissionServiceServer struct {
}

func (UnimplementedSubmissionServiceServer) ReportResult(context.Context, *ReportResultRequest) (*ReportResultResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ReportResult not implemented")
}
func (UnimplementedSubmissionServiceServer) mustEmbedUnimplementedSubmissionServiceServer() {}

type UnsafeSubmissionServiceServer interface {
	mustEmbedUnimplementedSubmissionServiceServer()
}

func RegisterSubmissionServiceServer(s grpc.ServiceRegistrar, srv SubmissionServiceServer) {
	s.RegisterService(&SubmissionService_ServiceDesc, srv)
}

func _SubmissionService_ReportResult_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ReportResultRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SubmissionServiceServer).ReportResult(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server: srv,
		FullMethod: "/submission.SubmissionService/ReportResult",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SubmissionServiceServer).ReportResult(ctx, req.(*ReportResultRequest))
	}
	return interceptor(ctx, in, info, handler)
}

var SubmissionService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "submission.SubmissionService",
	HandlerType: (*SubmissionServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "ReportResult",
			Handler:    _SubmissionService_ReportResult_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "submission.proto",
}
