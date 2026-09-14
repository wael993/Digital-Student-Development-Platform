class PageResult<T> {
  const PageResult({
    required this.data,
    required this.page,
    required this.limit,
    required this.total,
  });

  final List<T> data;
  final int page;
  final int limit;
  final int total;

  bool get hasMore => data.length < total;

  factory PageResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic> json) parse,
  ) {
    final meta = json['meta'] as Map<String, dynamic>? ?? const {};
    return PageResult(
      data: (json['data'] as List<dynamic>? ?? [])
          .map((row) => parse(row as Map<String, dynamic>))
          .toList(),
      page: (meta['page'] as num?)?.toInt() ?? 1,
      limit: (meta['limit'] as num?)?.toInt() ?? 20,
      total: (meta['total'] as num?)?.toInt() ?? 0,
    );
  }
}
