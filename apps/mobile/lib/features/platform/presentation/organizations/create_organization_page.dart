import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/features/platform/data/platform_repository.dart';
import 'package:digital_student/features/platform/presentation/organizations/organization_details_page.dart';
import 'package:digital_student/features/platform/providers/platform_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CreateOrganizationPage extends ConsumerStatefulWidget {
  const CreateOrganizationPage({super.key});

  @override
  ConsumerState<CreateOrganizationPage> createState() =>
      _CreateOrganizationPageState();
}

class _CreateOrganizationPageState extends ConsumerState<CreateOrganizationPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _country = TextEditingController(text: 'SA');
  final _timezone = TextEditingController(text: 'Asia/Riyadh');
  final _contactEmail = TextEditingController();
  final _contactPhone = TextEditingController();
  final _address = TextEditingController();
  final _website = TextEditingController();
  final _logoUrl = TextEditingController();
  final _adminFirst = TextEditingController();
  final _adminLast = TextEditingController();
  final _adminEmail = TextEditingController();
  final _adminPassword = TextEditingController();

  String _language = 'ar';
  String _plan = 'STARTER';
  bool _saving = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _name.dispose();
    _country.dispose();
    _timezone.dispose();
    _contactEmail.dispose();
    _contactPhone.dispose();
    _address.dispose();
    _website.dispose();
    _logoUrl.dispose();
    _adminFirst.dispose();
    _adminLast.dispose();
    _adminEmail.dispose();
    _adminPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return SchoolScaffold(
      title: l10n.createOrganization,
      showAttendanceShortcut: false,
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              key: const Key('orgNameField'),
              controller: _name,
              decoration: InputDecoration(labelText: l10n.organizationName),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            TextFormField(
              key: const Key('orgCountryField'),
              controller: _country,
              decoration: InputDecoration(labelText: l10n.organizationCountry),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            TextFormField(
              controller: _timezone,
              decoration: InputDecoration(labelText: l10n.organizationTimezone),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            DropdownButtonFormField<String>(
              initialValue: _language,
              decoration: InputDecoration(labelText: l10n.organizationDefaultLanguage),
              items: [
                DropdownMenuItem(value: 'ar', child: Text(l10n.arabic)),
                DropdownMenuItem(value: 'en', child: Text(l10n.english)),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _language = value);
              },
            ),
            TextFormField(
              key: const Key('orgContactEmailField'),
              controller: _contactEmail,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: l10n.organizationContactEmail),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return l10n.fieldRequired;
                if (!v.contains('@')) return l10n.invalidEmail;
                return null;
              },
            ),
            DropdownButtonFormField<String>(
              key: const Key('orgPlanField'),
              initialValue: _plan,
              decoration: InputDecoration(labelText: l10n.organizationPlan),
              items: [
                for (final plan in organizationPlans)
                  DropdownMenuItem(
                    value: plan,
                    child: Text(organizationPlanLabel(l10n, plan)),
                  ),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _plan = value);
              },
            ),
            TextFormField(
              controller: _contactPhone,
              decoration: InputDecoration(labelText: l10n.organizationContactPhoneOptional),
            ),
            TextFormField(
              controller: _address,
              decoration: InputDecoration(labelText: l10n.organizationAddressOptional),
            ),
            TextFormField(
              controller: _website,
              decoration: InputDecoration(labelText: l10n.organizationWebsiteOptional),
            ),
            TextFormField(
              controller: _logoUrl,
              decoration: InputDecoration(labelText: l10n.organizationLogoOptional),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.initialAdminSection,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            TextFormField(
              key: const Key('adminFirstNameField'),
              controller: _adminFirst,
              decoration: InputDecoration(labelText: l10n.adminFirstName),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            TextFormField(
              key: const Key('adminLastNameField'),
              controller: _adminLast,
              decoration: InputDecoration(labelText: l10n.adminLastName),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            TextFormField(
              key: const Key('adminEmailField'),
              controller: _adminEmail,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: l10n.adminEmail),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return l10n.fieldRequired;
                if (!v.contains('@')) return l10n.invalidEmail;
                return null;
              },
            ),
            TextFormField(
              key: const Key('adminPasswordField'),
              controller: _adminPassword,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                labelText: l10n.password,
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  icon: Icon(
                    _obscurePassword ? Icons.visibility : Icons.visibility_off,
                  ),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return l10n.fieldRequired;
                if (v.length < 8) return l10n.passwordTooWeak;
                return null;
              },
            ),
            const SizedBox(height: 24),
            FilledButton(
              key: const Key('submitCreateOrganizationButton'),
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(l10n.createOrganization),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _saving = true);
    try {
      final result = await ref.read(platformRepositoryProvider).createOrganization(
            CreateOrganizationRequest(
              name: _name.text,
              country: _country.text,
              timezone: _timezone.text,
              defaultLanguage: _language,
              contactEmail: _contactEmail.text,
              planCode: _plan,
              contactPhone: _contactPhone.text,
              address: _address.text,
              website: _website.text,
              logoUrl: _logoUrl.text,
              adminFirstName: _adminFirst.text,
              adminLastName: _adminLast.text,
              adminEmail: _adminEmail.text,
              adminPassword: _adminPassword.text,
            ),
          );
      // never persist owner-entered password after submit
      _adminPassword.clear();
      invalidatePlatformOrgData(ref, organizationId: result.organization.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.organizationCreatedWithInitialAdmin)),
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => OrganizationDetailsPage(
            organizationId: result.organization.id,
          ),
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
