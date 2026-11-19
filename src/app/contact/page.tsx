
"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Connect this form to your API later.
    alert("Thank you! Your message has been submitted.");

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  }

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gray-50 px-6 py-20 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Get In Touch
        </span>

        <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
          Contact Us
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-gray-600">
          Have a question about an order, product, or anything else?
          We'd love to hear from you.
        </p>
      </section>

      {/* Contact Content */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Let's Talk
          </h2>

          <p className="mt-3 leading-7 text-gray-600">
            Our team is here to help. Reach out to us using any of
            the contact details below.
          </p>

          <div className="mt-10 space-y-7">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Mail className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Email
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  support@example.com
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Phone className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Phone
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  +95 9 000 000 000
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <MapPin className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Location
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Myanmar
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Clock className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Business Hours
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Monday - Saturday
                </p>
                <p className="text-sm text-gray-600">
                  9:00 AM - 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-gray-100 p-7 shadow-sm lg:col-span-2 md:p-10">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-blue-600" size={25} />
              <h2 className="text-2xl font-bold text-gray-900">
                Send Us a Message
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Fill out the form below and we'll get back to you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                required
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your Message
              </label>
              <textarea
                required
                rows={6}
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Send Message
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
