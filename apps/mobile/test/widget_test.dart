import 'package:digital_student/app.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
  });

  testWidgets('renders the Digital Student placeholder', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: DigitalStudentApp()));

    expect(find.text('Digital Student'), findsOneWidget);
    expect(find.text('API: http://localhost:3000/api/v1'), findsOneWidget);
  });
}
